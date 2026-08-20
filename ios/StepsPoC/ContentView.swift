import SwiftUI

struct ContentView: View {
    @StateObject private var healthKitManager = HealthKitManager()
    @State private var productURL: URL?
    @State private var urlBuildErrorMessage: String?
    @Environment(\.scenePhase) private var scenePhase
    /// Bumped every time the app returns to the foreground, independent of
    /// whether the WKWebView's own visibilitychange/pageshow DOM events
    /// fire — see ProductWebView.foregroundTick.
    @State private var foregroundTick = 0

    private let productionBaseURL = URL(string: "https://product-04.nowgnoheel.workers.dev/")!

    var body: some View {
        Group {
            if let productURL {
                ProductWebView(url: productURL, foregroundTick: foregroundTick)
                    .ignoresSafeArea()
            } else {
                VStack(spacing: 16) {
                    Text("오늘 걸음 수")
                        .font(.headline)
                        .foregroundStyle(.secondary)

                    content

                    if let urlBuildErrorMessage {
                        Text(urlBuildErrorMessage)
                            .font(.footnote)
                            .foregroundStyle(.red)
                            .multilineTextAlignment(.center)
                    }

                    Button("새로고침") {
                        healthKitManager.fetchTodaySteps()
                    }
                    .disabled(healthKitManager.state == .loading)
                }
                .padding()
            }
        }
        .onAppear {
            healthKitManager.fetchTodaySteps()
        }
        .onChange(of: healthKitManager.state) { _, newState in
            if case .loaded(let total, let iphone) = newState {
                productURL = buildProductURL(total: total, iphone: iphone)
            }
        }
        .onChange(of: scenePhase) { _, newPhase in
            guard newPhase == .active else { return }
            // Two independent signals, not one: foregroundTick tells the
            // already-loaded page "you're visible again, re-check your own
            // local state" (see ProductWebView/usePageReactivation.ts) —
            // it does not know or care whether HealthKit has anything new.
            // fetchTodaySteps() re-queries HealthKit for *today* so a
            // foreground that crosses a local-day boundary (app merely
            // backgrounded, never relaunched) gets today's real total/iphone
            // instead of leaving productURL — and therefore the URL actually
            // loaded in the WebView — stuck on whatever day it was built.
            foregroundTick += 1
            healthKitManager.fetchTodaySteps()
        }
    }

    /// Extends the existing `?steps=<total>` contract additively with
    /// `&iphoneSteps=<iphone>` — `steps` keeps its original meaning/format
    /// unchanged. `iphoneSteps` is only appended when available, so a build
    /// that can't confidently resolve it produces the exact same URL as
    /// before this field existed.
    private func buildProductURL(total: Int, iphone: Int?) -> URL? {
        guard var components = URLComponents(url: productionBaseURL, resolvingAgainstBaseURL: false) else {
            urlBuildErrorMessage = "Product 04 URL을 구성할 수 없습니다."
            return nil
        }

        var queryItems = [URLQueryItem(name: "steps", value: String(total))]
        if let iphone {
            queryItems.append(URLQueryItem(name: "iphoneSteps", value: String(iphone)))
        }
        components.queryItems = queryItems

        guard let url = components.url else {
            urlBuildErrorMessage = "Product 04 URL을 구성할 수 없습니다."
            return nil
        }

        urlBuildErrorMessage = nil
        return url
    }

    @ViewBuilder
    private var content: some View {
        switch healthKitManager.state {
        case .idle, .loading:
            ProgressView()
                .frame(height: 60)
        case .loaded(let total, _):
            Text("\(formatted(total))보")
                .font(.system(size: 48, weight: .bold))
        case .error(let message):
            Text(message)
                .foregroundStyle(.red)
                .multilineTextAlignment(.center)
        }
    }

    private func formatted(_ steps: Int) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return formatter.string(from: NSNumber(value: steps)) ?? "\(steps)"
    }
}

#Preview {
    ContentView()
}
