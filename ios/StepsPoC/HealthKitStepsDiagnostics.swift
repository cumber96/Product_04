import Foundation
import HealthKit

/// Diagnostic-only HealthKit reader. Reports today's step count broken down
/// by contributing HKSource (e.g. iPhone Health app, Apple Watch, banking
/// apps that write steps), alongside the same combined total
/// HealthKitManager already computes.
///
/// This exists to answer one question on a real device: does HealthKit's
/// unified stepCount total already merge iPhone + Apple Watch data, and what
/// is each individual source independently reporting? It does not replace,
/// call, or modify HealthKitManager — kept fully separate so the existing
/// PoC screen and its query are untouched. Not wired into the Shortcuts/PWA
/// flow, Home benefit logic, or any banking app condition.
///
/// Uses the same read-only stepCount authorization HealthKitManager already
/// requests; no new HealthKit permission type is introduced.
@MainActor
final class HealthKitStepsDiagnostics: ObservableObject {
    struct SourceStepEntry: Identifiable {
        /// HKSource.bundleIdentifier — unique per source, unlike the
        /// user-editable display name (e.g. a Health app source can be
        /// locally renamed, as seen with the "HH" source on the reference
        /// device). Never treat the display name as a stable identifier.
        let id: String
        let sourceName: String
        let bundleIdentifier: String
        let steps: Int
        /// Best-effort device identification pulled from one representative
        /// sample for this source today (HKDevice name/model/hardware +
        /// HKSourceRevision.productType, e.g. "Watch6,1" or "iPhone14,5").
        /// nil when no sample from this source carries device metadata —
        /// this is optional/best-effort per HealthKit, not guaranteed.
        let deviceDescription: String?
    }

    struct Result {
        /// Combined step total exactly as HealthKitManager.queryTodayStepTotal
        /// computes it (cumulativeSum, no source separation) — recomputed
        /// independently here so this diagnostics type has no dependency on
        /// HealthKitManager's internals.
        let unifiedTotal: Int
        let sources: [SourceStepEntry]
    }

    enum State {
        case idle
        case loading
        case loaded(Result)
        case error(String)
    }

    @Published private(set) var state: State = .idle

    private let healthStore = HKHealthStore()

    private var stepType: HKQuantityType {
        get throws {
            guard let type = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
                throw StepsDiagnosticsError.stepTypeUnavailable
            }
            return type
        }
    }

    func fetchDiagnostics() {
        guard HKHealthStore.isHealthDataAvailable() else {
            state = .error("이 기기에서는 HealthKit을 사용할 수 없습니다.")
            return
        }

        state = .loading

        Task {
            do {
                let type = try stepType
                try await healthStore.requestAuthorization(toShare: [], read: [type])
                let result = try await queryTodayStepsBySource(type: type)
                state = .loaded(result)
            } catch {
                state = .error(error.localizedDescription)
            }
        }
    }

    private func todayPredicate() -> NSPredicate {
        let startOfDay = Calendar.current.startOfDay(for: Date())
        let now = Date()
        return HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)
    }

    /// HKStatisticsQuery with [.cumulativeSum, .separateBySource]: the same
    /// query family HealthKitManager uses, with source separation added.
    /// The overall sum (statistics.sumQuantity()) is identical to what a
    /// plain .cumulativeSum-only query returns — separateBySource only adds
    /// the per-source breakdown via statistics.sumQuantity(for:) and
    /// statistics.sources, it does not change the combined total.
    private func queryTodayStepsBySource(type: HKQuantityType) async throws -> Result {
        let predicate = todayPredicate()

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
                    continuation.resume(throwing: StepsDiagnosticsError.statisticsUnavailable)
                    return
                }
                continuation.resume(returning: statistics)
            }
            healthStore.execute(query)
        }

        let unifiedTotal = Int((statistics.sumQuantity()?.doubleValue(for: .count()) ?? 0).rounded())

        guard let sources = statistics.sources, !sources.isEmpty else {
            return Result(unifiedTotal: unifiedTotal, sources: [])
        }

        var entries: [SourceStepEntry] = []
        for source in sources {
            let sourceSteps = statistics.sumQuantity(for: source)?.doubleValue(for: .count()) ?? 0
            let deviceDescription = try? await self.deviceDescription(for: source, type: type, predicate: predicate)
            entries.append(
                SourceStepEntry(
                    id: source.bundleIdentifier,
                    sourceName: source.name,
                    bundleIdentifier: source.bundleIdentifier,
                    steps: Int(sourceSteps.rounded()),
                    deviceDescription: deviceDescription
                )
            )
        }

        entries.sort { $0.steps > $1.steps }
        return Result(unifiedTotal: unifiedTotal, sources: entries)
    }

    /// Best-effort only: fetches the single most recent sample today from
    /// this source and reads its device metadata. Returns nil (never
    /// throws outward — callers use try?) when unavailable, since device
    /// metadata is optional per HealthKit and must not block the source
    /// breakdown from displaying.
    private func deviceDescription(
        for source: HKSource,
        type: HKQuantityType,
        predicate: NSPredicate
    ) async throws -> String? {
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

        guard let sample = samples.first else { return nil }

        var parts: [String] = []
        if let device = sample.device {
            if let name = device.name { parts.append(name) }
            if let model = device.model { parts.append(model) }
            if let hardware = device.hardwareVersion { parts.append("hw:\(hardware)") }
        }
        if let productType = sample.sourceRevision.productType {
            parts.append("productType:\(productType)")
        }

        return parts.isEmpty ? nil : parts.joined(separator: " / ")
    }
}

enum StepsDiagnosticsError: LocalizedError {
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
