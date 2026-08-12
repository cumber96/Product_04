import type { Benefit, BenefitStatusMap } from './types';

/**
 * Baseline status for 'steps' condition benefits, derived from the current
 * step count. Non-steps benefits are omitted so callers fall back to their
 * own default. currentSteps === null (no ?steps= param) locks every steps
 * benefit rather than treating it as 0 met-or-not — same visible result,
 * but keeps "no data" distinct from "0 steps" for future callers.
 */
export function computeStepsBaselineStatus(
  benefits: Benefit[],
  currentSteps: number | null,
): BenefitStatusMap {
  const statusMap: BenefitStatusMap = {};
  for (const benefit of benefits) {
    if (benefit.condition.type !== 'steps' || benefit.condition.steps === undefined) continue;
    statusMap[benefit.id] =
      currentSteps !== null && currentSteps >= benefit.condition.steps ? 'available' : 'locked';
  }
  return statusMap;
}
