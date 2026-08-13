import SwiftUI

struct ContentView: View {
    @StateObject private var healthKitManager = HealthKitManager()
    @State private var productURL: URL?
    @State private var urlBuildErrorMessage: String?

    private let productionBaseURL = URL(string: "https://product-04.nowgnoheel.workers.dev/")!

    var body: some View {
        Group {
            if let productURL {
                ProductWebView(url: productURL)
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
            if case .loaded(let steps) = newState {
                productURL = buildProductURL(withSteps: steps)
            }
        }
    }

    private func buildProductURL(withSteps steps: Int) -> URL? {
        guard var components = URLComponents(url: productionBaseURL, resolvingAgainstBaseURL: false) else {
            urlBuildErrorMessage = "Product 04 URL을 구성할 수 없습니다."
            return nil
        }
        components.queryItems = [URLQueryItem(name: "steps", value: String(steps))]

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
        case .loaded(let steps):
            Text("\(formatted(steps))보")
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
