import WidgetKit
import SwiftUI

struct BenefitEntry: TimelineEntry {
    let date: Date
    /// nil = native hasn't received a snapshot from the web app yet.
    let pendingBenefitCount: Int?
}

/// ProductWebView calls WidgetCenter.reloadTimelines every time the web
/// app's available-benefit count changes, so that stays the primary path
/// while the app is running. But a stored snapshot never rewrites itself
/// across a midnight rollover on its own, so this also self-schedules a
/// refresh for the next local midnight (see nextMidnight(after:)) and
/// discards the count if the snapshot's date has fallen behind today (see
/// resolvedPendingBenefitCount) — together these keep the Lock Screen
/// correct even if the app is never opened after the date changes.
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> BenefitEntry {
        BenefitEntry(date: Date(), pendingBenefitCount: 3)
    }

    func getSnapshot(in context: Context, completion: @escaping (BenefitEntry) -> Void) {
        completion(BenefitEntry(date: Date(), pendingBenefitCount: resolvedPendingBenefitCount()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<BenefitEntry>) -> Void) {
        let now = Date()
        let entry = BenefitEntry(date: now, pendingBenefitCount: resolvedPendingBenefitCount(now: now))
        completion(Timeline(entries: [entry], policy: .after(nextMidnight(after: now))))
    }

    /// nil (no snapshot yet) is passed through unchanged. Otherwise the
    /// snapshot is only trusted when its updatedAt falls on the same local
    /// calendar day as `now` — a snapshot from yesterday or earlier reports
    /// 0 instead of the stale count.
    private func resolvedPendingBenefitCount(now: Date = Date()) -> Int? {
        guard let count = WidgetSnapshotStore.loadPendingBenefitCount() else { return nil }
        guard let updatedAt = WidgetSnapshotStore.loadUpdatedAt(),
              Calendar.current.isDate(updatedAt, inSameDayAs: now) else {
            return 0
        }
        return count
    }

    /// Calendar-based (not `+86400`) so this lands on the correct wall-clock
    /// midnight across DST transitions and any time zone.
    private func nextMidnight(after date: Date) -> Date {
        let calendar = Calendar.current
        let startOfToday = calendar.startOfDay(for: date)
        return calendar.date(byAdding: .day, value: 1, to: startOfToday) ?? startOfToday.addingTimeInterval(86_400)
    }
}

/// Lock Screen only (.accessoryRectangular) — no background/card chrome of
/// our own, since the system already renders the tinted/monochrome material
/// behind lock screen widgets and supplies its own text color there.
struct Product04BenefitWidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("오늘 받을 혜택")
                .font(.caption2)
                .foregroundStyle(.secondary)
            Text(statusLine)
                .font(.headline)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
    }

    private var statusLine: String {
        guard let count = entry.pendingBenefitCount else {
            return "앱에서 확인해보세요"
        }
        if count == 0 {
            return "오늘 혜택 완료"
        }
        return "\(count)개 남았어요"
    }
}

struct Product04BenefitWidget: Widget {
    let kind: String = WidgetSnapshotStore.widgetKind

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            Product04BenefitWidgetEntryView(entry: entry)
                // iOS 17+ requires every widget family (including Lock
                // Screen accessory families) to adopt containerBackground,
                // or WidgetKit renders a "Please adopt..." placeholder
                // instead of the view. .clear satisfies the API without
                // drawing a background of our own — the system still fully
                // owns the tint/monochrome rendering on the Lock Screen.
                .containerBackground(.clear, for: .widget)
        }
        .configurationDisplayName("오늘 받을 혜택")
        .description("잠금화면에서 현재 받을 수 있는 혜택 개수를 보여줘요.")
        .supportedFamilies([.accessoryRectangular])
    }
}

#Preview(as: .accessoryRectangular) {
    Product04BenefitWidget()
} timeline: {
    BenefitEntry(date: .now, pendingBenefitCount: 3)
    BenefitEntry(date: .now, pendingBenefitCount: 0)
    BenefitEntry(date: .now, pendingBenefitCount: nil)
}
