export interface WidgetSnapshot {
  pendingBenefitCount: number;
  updatedAt: string;
}

/**
 * Only the native iOS shell injects window.webkit.messageHandlers.
 * Safari/PWA (and any other browser) never has this, so this is a silent
 * no-op there — Home's own rendering is the only thing those contexts rely on.
 */
export function postWidgetSnapshot(snapshot: WidgetSnapshot): void {
  const handler = window.webkit?.messageHandlers?.product04Widget;
  if (!handler) return;
  handler.postMessage(snapshot);
}

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        product04Widget?: {
          postMessage: (message: WidgetSnapshot) => void;
        };
      };
    };
  }
}
