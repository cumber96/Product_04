import SwiftUI

/// Diagnostic screen for comparing HealthKit's unified step total against
/// its per-source breakdown (iPhone, Apple Watch, and any other source that
/// writes stepCount samples). Reuses ContentView's state-machine/formatting
/// structure. Standalone — not reachable from ContentView, StepsPoCApp's
/// WindowGroup, or the PWA; nothing existing routes here. See
/// ios/StepsPoC/README.md for how to point the WindowGroup at this view
/// temporarily on a real device to QA it.
struct StepsDiagnosticView: View {
    @StateObject private var diagnostics = HealthKitStepsDiagnostics()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("오늘 걸음 진단")
                    .font(.title2.bold())

                content

                Button("새로고침") {
                    diagnostics.fetchDiagnostics()
                }
                .disabled(isLoading)
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .onAppear {
            diagnostics.fetchDiagnostics()
        }
    }

    private var isLoading: Bool {
        if case .loading = diagnostics.state { return true }
        return false
    }

    @ViewBuilder
    private var content: some View {
        switch diagnostics.state {
        case .idle, .loading:
            ProgressView()
                .frame(height: 60)
        case .error(let message):
            Text(message)
                .foregroundStyle(.red)
        case .loaded(let result):
            loadedContent(result)
        }
    }

    @ViewBuilder
    private func loadedContent(_ result: HealthKitStepsDiagnostics.Result) -> some View {
        let classified = result.sources.map { entry in (entry: entry, kind: classify(entry)) }
        let iPhoneEntries = classified.filter { $0.kind == .iPhoneLike }.map { $0.entry }
        let watchEntries = classified.filter { $0.kind == .watchLike }.map { $0.entry }

        VStack(alignment: .leading, spacing: 16) {
            summaryTile(title: "HealthKit 통합", value: formatted(result.unifiedTotal) + "보")

            summaryGroup(title: "iPhone (추정)", entries: iPhoneEntries)
            summaryGroup(title: "Apple Watch (추정)", entries: watchEntries)

            Divider()

            Text("Sources (원본 전체, \(result.sources.count)개)")
                .font(.headline)

            if result.sources.isEmpty {
                Text("오늘 기록된 source가 없습니다.")
                    .foregroundStyle(.secondary)
            } else {
                ForEach(result.sources) { entry in
                    sourceRow(entry, kind: classify(entry))
                }
            }

            Text("""
            iPhone/Apple Watch 분류는 device 메타데이터 기반 추정치이며 진단 화면 \
            표시용일 뿐입니다. 여러 개로 나타나는 source는 절대 합산하지 않고 \
            개별로 표시합니다.
            """)
            .font(.footnote)
            .foregroundStyle(.secondary)
        }
    }

    /// A single unambiguous number — used only for the unified total, which
    /// is genuinely one query result, not a merge across sources.
    private func summaryTile(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.system(size: 32, weight: .bold))
        }
    }

    /// Never sums across entries. Shows a single number only when exactly
    /// one matching source exists; otherwise lists each one so multiple
    /// Apple Watch (or iPhone) sources are never silently combined.
    @ViewBuilder
    private func summaryGroup(title: String, entries: [HealthKitStepsDiagnostics.SourceStepEntry]) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            switch entries.count {
            case 0:
                Text("해당 없음")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(.secondary)
            case 1:
                Text(formatted(entries[0].steps) + "보")
                    .font(.system(size: 32, weight: .bold))
            default:
                Text("source \(entries.count)개 — 합산하지 않음, 아래 개별 값 확인")
                    .font(.footnote)
                    .foregroundStyle(.orange)
                ForEach(entries) { entry in
                    Text("· \(entry.sourceName): \(formatted(entry.steps))보")
                        .font(.subheadline)
                }
            }
        }
    }

    private func sourceRow(_ entry: HealthKitStepsDiagnostics.SourceStepEntry, kind: SourceKind) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Text(entry.sourceName)
                    .font(.body.weight(.semibold))
                Text(kind.label)
                    .font(.caption2)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.secondary.opacity(0.15))
                    .clipShape(Capsule())
                Spacer()
                Text(formatted(entry.steps) + "보")
                    .font(.body.weight(.semibold))
            }
            Text(entry.bundleIdentifier)
                .font(.caption)
                .foregroundStyle(.secondary)
            if let deviceDescription = entry.deviceDescription {
                Text(deviceDescription)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 6)
    }

    /// Diagnostic-only, display-only classification. Based on device
    /// metadata (HKDevice.model/name, HKSourceRevision.productType), never
    /// on the source's user-editable display name — the reference device
    /// has a Health-app source locally renamed to "HH", which must not be
    /// baked in as an identifier anywhere, including here. When no device
    /// metadata is available, the source is left unclassified rather than
    /// guessed. Not used anywhere outside this view; production logic must
    /// pick its own, separately-vetted discriminator later.
    private enum SourceKind: Equatable {
        case iPhoneLike
        case watchLike
        case unclassified

        var label: String {
            switch self {
            case .iPhoneLike: return "iPhone 추정"
            case .watchLike: return "Watch 추정"
            case .unclassified: return "미분류"
            }
        }
    }

    private func classify(_ entry: HealthKitStepsDiagnostics.SourceStepEntry) -> SourceKind {
        let haystack = (entry.deviceDescription ?? "").lowercased()
        if haystack.contains("watch") {
            return .watchLike
        }
        if haystack.contains("iphone") {
            return .iPhoneLike
        }
        return .unclassified
    }

    private func formatted(_ value: Int) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return formatter.string(from: NSNumber(value: value)) ?? "\(value)"
    }
}

#Preview {
    StepsDiagnosticView()
}
