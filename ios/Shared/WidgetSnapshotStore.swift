import Foundation

/// Shared between the StepsPoC app target and Product04WidgetExtension —
/// add this file to BOTH targets' membership in Xcode. It is the only
/// place that knows the App Group suite name and UserDefaults keys, so the
/// two targets can never drift out of sync on the storage format.
enum WidgetSnapshotStore {
    static let appGroupID = "group.cumber96.StepsPoC"
    static let widgetKind = "Product04BenefitWidget"
    static let messageHandlerName = "product04Widget"

    private static let pendingBenefitCountKey = "pendingBenefitCount"
    private static let updatedAtKey = "updatedAt"

    private static var defaults: UserDefaults? {
        UserDefaults(suiteName: appGroupID)
    }

    static func save(pendingBenefitCount: Int, updatedAt: String) {
        guard let defaults else { return }
        defaults.set(pendingBenefitCount, forKey: pendingBenefitCountKey)
        defaults.set(updatedAt, forKey: updatedAtKey)
    }

    /// nil means "native hasn't received a snapshot from the web app yet",
    /// distinct from a legitimate 0.
    static func loadPendingBenefitCount() -> Int? {
        guard let defaults, defaults.object(forKey: pendingBenefitCountKey) != nil else {
            return nil
        }
        return defaults.integer(forKey: pendingBenefitCountKey)
    }
}
