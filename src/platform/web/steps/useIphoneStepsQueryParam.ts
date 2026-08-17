import { useMemo } from 'react';
import { parseIphoneStepsParam } from '../../../domain/steps/parseIphoneStepsParam';

/**
 * iPhone-source-only counterpart to useStepsQueryParam: reads `iphoneSteps`
 * from the current page URL (e.g. /?steps=6427&iphoneSteps=2303). Returns
 * null on a legacy delivery that predates this field (only `?steps=` sent)
 * — see useLatestSteps for how that null is handled.
 */
export function useIphoneStepsQueryParam(reactivationTick = 0): number | null {
  return useMemo(() => parseIphoneStepsParam(window.location.search), [reactivationTick]);
}
