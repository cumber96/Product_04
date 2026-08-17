import SwiftUI
import WebKit
import WidgetKit

/// Displays Product 04 inside the app, full-screen, with no Safari chrome.
/// http/https navigations load normally; any other scheme (e.g. the
/// supertoss://, monimo://, kakaobank:// schemes Product 04 uses to launch
/// banking apps directly) is handed off to iOS via UIApplication and
/// cancelled in the WebView itself.
struct ProductWebView: UIViewRepresentable {
    let url: URL
    /// Bumped by ContentView on scenePhase → .active. WKWebView's own
    /// visibilitychange/pageshow DOM events are the web-side reactivation
    /// signal (see usePageReactivation.ts) but aren't fully reliable after
    /// backgrounding via a custom URL scheme handoff (e.g. supertoss://) —
    /// this is a native-side fallback/complement that dispatches the same
    /// kind of signal directly into the page via JS, so Confirmation's
    /// pending check still runs even if the DOM events don't fire. The web
    /// side treats it as just another trigger and already dedupes repeated
    /// triggers for the same pending, so firing both is harmless.
    var foregroundTick: Int = 0

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.userContentController.add(
            context.coordinator,
            name: WidgetSnapshotStore.messageHandlerName
        )

        let webView = WKWebView(frame: .zero, configuration: configuration)
        // SwiftUI's .ignoresSafeArea() already lays this view out full-screen;
        // without this, the scroll view's default .automatic behavior
        // re-applies its own safe-area-based bottom content inset on top of
        // that, and the two disagree during scroll (visible as the Home
        // floating bar drifting near the bottom of the page).
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        #if DEBUG
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
        #endif
        webView.navigationDelegate = context.coordinator
        webView.load(URLRequest(url: url))
        context.coordinator.lastForegroundTick = foregroundTick
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if context.coordinator.lastForegroundTick != foregroundTick {
            context.coordinator.lastForegroundTick = foregroundTick
            webView.evaluateJavaScript(
                "window.dispatchEvent(new Event('product04:foreground'))",
                completionHandler: nil
            )
        }

        guard webView.url != url else { return }
        webView.load(URLRequest(url: url))
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        var lastForegroundTick = 0

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let url = navigationAction.request.url,
                  let scheme = url.scheme?.lowercased() else {
                decisionHandler(.allow)
                return
            }

            guard scheme == "http" || scheme == "https" else {
                decisionHandler(.cancel)
                UIApplication.shared.open(url)
                return
            }

            decisionHandler(.allow)
        }
    }
}

/// Receives the pendingBenefitCount snapshot the web app posts via
/// window.webkit.messageHandlers.product04Widget, and forwards it to the
/// widget's storage. Does not recompute anything — the web app already did.
extension ProductWebView.Coordinator: WKScriptMessageHandler {
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == WidgetSnapshotStore.messageHandlerName,
              let body = message.body as? [String: Any],
              let pendingBenefitCount = body["pendingBenefitCount"] as? Int,
              let updatedAt = body["updatedAt"] as? String else {
            return
        }

        WidgetSnapshotStore.save(pendingBenefitCount: pendingBenefitCount, updatedAt: updatedAt)
        WidgetCenter.shared.reloadTimelines(ofKind: WidgetSnapshotStore.widgetKind)
    }
}
