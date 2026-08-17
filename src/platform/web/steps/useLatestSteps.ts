import { useEffect, useMemo } from 'react';
import { resolveCurrentSteps } from '../../../domain/steps/resolveCurrentSteps';
import { useStepsQueryParam } from './useStepsQueryParam';
import { useIphoneStepsQueryParam } from './useIphoneStepsQueryParam';
import { loadStoredSteps, saveStoredSteps } from './stepsStorage';

export interface LatestSteps {
  /** HealthKit unified/total step count — same value/behavior as before iphoneSteps existed. */
  steps: number | null;
  /**
   * iPhone-source-only step count. null when neither this delivery nor any
   * previously stored one ever carried it (legacy Shortcut/app build that
   * only sends `?steps=`). Callers that need a value for eligibility must
   * fall back to `steps` themselves — see domain/benefits/resolveStepsForApp.
   */
  iphoneSteps: number | null;
}

/**
 * Steps values Home/eligibleToday should use: a fresh ?steps=/&iphoneSteps=
 * from a real navigation always wins (and is persisted as the new "last
 * known" value); a return to this page carrying no query params falls back
 * to the last values a Shortcut/native app delivered, instead of resetting
 * every steps benefit to locked.
 *
 * Deliberately separate from useStepsQueryParam, which the Steps PoC still
 * uses unwrapped — the PoC is meant to show exactly what the current URL is
 * delivering, with no fallback, so it must not gain this behavior.
 */
export function useLatestSteps(reactivationTick: number): LatestSteps {
  const urlSteps = useStepsQueryParam(reactivationTick);
  const urlIphoneSteps = useIphoneStepsQueryParam(reactivationTick);

  useEffect(() => {
    // Same trigger as before iphoneSteps existed: only a genuine ?steps=
    // delivery persists anything. iphoneSteps rides along when this
    // delivery carries it; when it doesn't (legacy sender), the previously
    // stored iphoneSteps is kept instead of being overwritten to null, so a
    // one-off legacy request can't erase a value a newer app build already
    // delivered.
    if (urlSteps === null) return;
    const previousIphoneSteps = loadStoredSteps()?.iphoneSteps ?? null;
    saveStoredSteps(urlSteps, urlIphoneSteps ?? previousIphoneSteps);
  }, [urlSteps, urlIphoneSteps]);

  return useMemo(() => {
    const stored = loadStoredSteps();
    return {
      steps: resolveCurrentSteps(urlSteps, stored?.steps ?? null),
      iphoneSteps: resolveCurrentSteps(urlIphoneSteps, stored?.iphoneSteps ?? null),
    };
  }, [urlSteps, urlIphoneSteps]);
}
