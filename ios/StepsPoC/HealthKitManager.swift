import Foundation
import HealthKit

/// Reads today's cumulative step count via HKStatisticsQuery, for comparison
/// against the value shown in the Apple Health app. No write access, no
/// other data types — this PoC only validates step-count accuracy.
@MainActor
final class HealthKitManager: ObservableObject {
    enum State: Equatable {
        case idle
        case loading
        /// total: unchanged HealthKit unified step count (same query/predicate
        /// as before iphoneSteps existed). iphone: best-effort iPhone-source
        /// step count, nil whenever this MVP can't confidently identify a
        /// single iPhone source (see queryTodayIPhoneStepTotal) — never a
        /// guessed or partial value.
        case loaded(total: Int, iphone: Int?)
        case error(String)
    }

    @Published private(set) var state: State = .idle

    private let healthStore = HKHealthStore()

    private var stepType: HKQuantityType {
        get throws {
            guard let type = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
                throw HealthKitError.stepTypeUnavailable
            }
            return type
        }
    }

    func fetchTodaySteps() {
        guard HKHealthStore.isHealthDataAvailable() else {
            state = .error("이 기기에서는 HealthKit을 사용할 수 없습니다.")
            return
        }

        state = .loading

        Task {
            do {
                let type = try stepType
                try await healthStore.requestAuthorization(toShare: [], read: [type])
                // Unchanged path: total must succeed or the whole fetch errors,
                // exactly as before iphoneSteps existed.
                let total = try await queryTodayStepTotal(type: type)
                // Additive, best-effort: any failure here (query error,
                // ambiguous/no iPhone source) degrades to nil rather than
                // failing the fetch — total alone must keep working even if
                // this never resolves.
                let iphone = try? await queryTodayIPhoneStepTotal(type: type)
                state = .loaded(total: total, iphone: iphone)
            } catch {
                state = .error(error.localizedDescription)
            }
        }
    }

    private func queryTodayStepTotal(type: HKQuantityType) async throws -> Int {
        let startOfDay = Calendar.current.startOfDay(for: Date())
        let now = Date()
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: type,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, statistics, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                let total = statistics?.sumQuantity()?.doubleValue(for: .count()) ?? 0
                continuation.resume(returning: Int(total.rounded()))
            }

            healthStore.execute(query)
        }
    }

    /// Today's step count from iPhone sources only, using the same date
    /// range as queryTodayStepTotal above (not shared code, but built from
    /// the identical Calendar.current.startOfDay(for:)/Date() construction,
    /// so the two totals are always comparable). MVP scope: returns a value
    /// only when exactly one source is confidently classified as an iPhone;
    /// returns nil for zero matches or more than one (see isIPhoneSource
    /// and the report on multi-source policy) rather than guessing.
    private func queryTodayIPhoneStepTotal(type: HKQuantityType) async throws -> Int? {
        let startOfDay = Calendar.current.startOfDay(for: Date())
        let now = Date()
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)

        let statistics: HKStatistics = try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: type,
                quantitySamplePredicate: predicate,
                options: [.cumulativeSum, .separateBySource]
            ) { _, statistics, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                guard let statistics else {
                    continuation.resume(throwing: HealthKitError.statisticsUnavailable)
                    return
                }
                continuation.resume(returning: statistics)
            }

            healthStore.execute(query)
        }

        guard let sources = statistics.sources, !sources.isEmpty else { return nil }

        var iPhoneSources: [HKSource] = []
        for source in sources {
            if try await isIPhoneSource(source, type: type, predicate: predicate) {
                iPhoneSources.append(source)
            }
        }

        // Structure is open for a real multi-source policy later (e.g. "most
        // recently active iPhone", or summing) — deliberately not decided
        // here. Any count other than exactly 1 returns nil.
        guard iPhoneSources.count == 1, let iPhoneSource = iPhoneSources.first else {
            return nil
        }

        let steps = statistics.sumQuantity(for: iPhoneSource)?.doubleValue(for: .count()) ?? 0
        return Int(steps.rounded())
    }

    /// source.name is never consulted here — it's a user-editable display
    /// label (e.g. renamed to "HH" on the reference device used to validate
    /// this), not a stable identifier. Classification instead inspects one
    /// representative sample's device metadata: HKSourceRevision.productType
    /// first (e.g. "iPhone14,5"), HKDevice.model as a secondary signal when
    /// productType is unavailable. Returns false — excluded, not guessed —
    /// whenever neither signal is available or conclusive.
    private func isIPhoneSource(
        _ source: HKSource,
        type: HKQuantityType,
        predicate: NSPredicate
    ) async throws -> Bool {
        let sourcePredicate = HKQuery.predicateForObjects(from: source)
        let combined = NSCompoundPredicate(andPredicateWithSubpredicates: [predicate, sourcePredicate])

        let samples: [HKSample] = try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: type,
                predicate: combined,
                limit: 1,
                sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
            ) { _, samples, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                continuation.resume(returning: samples ?? [])
            }

            healthStore.execute(query)
        }

        guard let sample = samples.first else { return false }

        if let productType = sample.sourceRevision.productType {
            return productType.hasPrefix("iPhone")
        }
        if let model = sample.device?.model {
            return model == "iPhone"
        }
        return false
    }
}

enum HealthKitError: LocalizedError {
    case stepTypeUnavailable
    case statisticsUnavailable

    var errorDescription: String? {
        switch self {
        case .stepTypeUnavailable:
            return "걸음 수 데이터 타입을 사용할 수 없습니다."
        case .statisticsUnavailable:
            return "통계 결과를 가져올 수 없습니다."
        }
    }
}
