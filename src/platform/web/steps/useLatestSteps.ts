import { useEffect, useMemo } from 'react';
import { resolveCurrentSteps } from '../../../domain/steps/resolveCurrentSteps';
import { useStepsQueryParam } from './useStepsQueryParam';
import { loadStoredSteps, saveStoredSteps } from './stepsStorage';

/**
 * Steps value Home/eligibleToday should use: a fresh ?steps= from a real
 * navigation always wins (and is persisted as the new "last known" value);
 * a return to this page carrying no ?steps= falls back to the last value a
 * Shortcut delivered, instead of resetting every steps benefit to locked.
 *
 * Deliberately separate from useStepsQueryParam, which the Steps PoC still
 * uses unwrapped — the PoC is meant to show exactly what the current URL is
 * delivering, with no fallback, so it must not gain this behavior.
 */
export function useLatestSteps(reactivationTick: number): number | null {
  const urlSteps = useStepsQueryParam(reactivationTick);

  useEffect(() => {
    if (urlSteps !== null) {
      saveStoredSteps(urlSteps);
    }
  }, [urlSteps]);

  return useMemo(
    () => resolveCurrentSteps(urlSteps, loadStoredSteps()?.steps ?? null),
    [urlSteps],
  );
}
