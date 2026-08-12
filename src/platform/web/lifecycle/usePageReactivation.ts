import { useEffect, useState } from 'react';

/**
 * Bumps a counter whenever this page becomes usable again without having
 * been unloaded — the tab/PWA regains foreground (visibilitychange →
 * 'visible') or the page is restored from the back/forward cache (pageshow).
 *
 * This matters because financial apps are launched via a custom URL scheme
 * (shortcuts://, see appLaunchUrls.ts): assigning it to location.href does
 * not navigate this page away on iOS Safari — the OS intercepts the scheme
 * and opens Shortcuts/the target app while this document (and its React
 * tree) stays alive in the background. A plain mount-time computation never
 * re-runs in that case, so consumers add this tick to their dependency
 * arrays to re-derive "now"-based state (local time, steps query) once the
 * user comes back.
 */
export function usePageReactivation(): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    function bump() {
      setTick((prev) => prev + 1);
    }
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') bump();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', bump);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', bump);
    };
  }, []);

  return tick;
}
