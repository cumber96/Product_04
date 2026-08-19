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

    // web's `new Date().toISOString()` always includes millisecond
    // fractional seconds (e.g. "2026-08-19T00:12:34.567Z"), which the
    // no-options ISO8601DateFormatter rejects — try fractional-seconds
    // first, then fall back for any value written without them.
    private static let isoFormatterWithFractionalSeconds: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let isoFormatter = ISO8601DateFormatter()

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

    /// nil means either no snapshot has ever been saved, or the stored
    /// string couldn't be parsed as ISO8601 — callers should treat both the
    /// same way (don't trust pendingBenefitCount's freshness).
    static func loadUpdatedAt() -> Date? {
        guard let defaults, let raw = defaults.string(forKey: updatedAtKey) else {
            return nil
        }
        return isoFormatterWithFractionalSeconds.date(from: raw) ?? isoFormatter.date(from: raw)
    }
}
