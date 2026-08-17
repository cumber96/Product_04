import { useEffect, useState } from 'react';
import { ensureDailyReset } from '../dailyReset/ensureDailyReset';

/**
 * Bumps a counter whenever this page becomes usable again without having
 * been unloaded — the tab/PWA regains foreground (visibilitychange →
 * 'visible') or the page is restored from the back/forward cache (pageshow).
 *
 * This matters because financial apps are launched via a custom URL scheme
 * (e.g. supertoss://, see appLaunchUrls.ts): assigning it to location.href
 * does not navigate this page away on iOS Safari — the OS intercepts the
 * scheme and opens the target app directly while this document (and its
 * React tree) stays alive in the background. A plain mount-time computation
 * never re-runs in that case, so consumers add this tick to their dependency
 * arrays to re-derive "now"-based state (local time, steps query, pending
 * confirmations) once the user comes back.
 *
 * Also listens for a `product04:foreground` event, dispatched by the native
 * iOS shell (see ios/StepsPoC/ProductWebView.swift) on scenePhase → active.
 * visibilitychange/pageshow aren't fully reliable after backgrounding via a
 * custom URL scheme handoff, so this is a native-side fallback/complement,
 * not a replacement — both can fire for the same physical foreground
 * moment, which is fine: consumers (e.g. useAutoConfirmation) already
 * dedupe repeated triggers for the same pending state.
 */
export function usePageReactivation(): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function bump() {
      // Must run before the tick bumps: consumers key their storage re-reads
      // off this tick, so daily state has to already be reset in storage by
      // the time they re-render (see features/home/useBenefitStatuses.ts,
      // features/home/usePendingConfirmations.ts).
      ensureDailyReset();
      setTick((prev) => prev + 1);
    }
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') bump();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', bump);
    window.addEventListener('product04:foreground', bump);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', bump);
      window.removeEventListener('product04:foreground', bump);
    };
  }, []);

  return tick;
}
