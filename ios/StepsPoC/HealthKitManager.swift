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
        case loaded(Int)
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
                let steps = try await queryTodayStepTotal(type: type)
                state = .loaded(steps)
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
}

enum HealthKitError: LocalizedError {
    case stepTypeUnavailable

    var errorDescription: String? {
        switch self {
        case .stepTypeUnavailable:
            return "걸음 수 데이터 타입을 사용할 수 없습니다."
        }
    }
}
