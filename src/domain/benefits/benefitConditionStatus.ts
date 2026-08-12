import type { Benefit, BenefitCondition, BenefitStatusMap } from './types';
import { getLocalTimeOfDay } from '../date/timeOfDay';
import { isLastDayOfMonth } from '../date/isLastDayOfMonth';

export interface BenefitConditionContext {
  currentSteps: number | null;
  now?: Date;
}

/**
 * Whether a single condition is met right now, using the user's local
 * time/date (never UTC). currentSteps === null locks every steps benefit
 * rather than treating it as 0 met-or-not, keeping "no data" distinct from
 * "0 steps" for future callers.
 */
function isConditionMetNow(condition: BenefitCondition, context: BenefitConditionContext): boolean {
  const now = context.now ?? new Date();
  switch (condition.type) {
    case 'daily':
      return true;
    case 'morning':
      return getLocalTimeOfDay(now) === 'morning';
    case 'afternoon':
      return getLocalTimeOfDay(now) === 'afternoon';
    case 'monthly-last-day':
      return isLastDayOfMonth(now);
    case 'steps':
      return (
        condition.steps !== undefined &&
        context.currentSteps !== null &&
        context.currentSteps >= condition.steps
      );
  }
}

/**
 * Baseline locked/available status for every benefit, derived purely from
 * current local time/date + step count. completed is layered on top by
 * computeStatusMap, which always wins over this baseline.
 */
export function computeBaselineStatus(
  benefits: Benefit[],
  context: BenefitConditionContext,
): BenefitStatusMap {
  const statusMap: BenefitStatusMap = {};
  for (const benefit of benefits) {
    statusMap[benefit.id] = isConditionMetNow(benefit.condition, context) ? 'available' : 'locked';
  }
  return statusMap;
}

/**
 * Ids of benefits whose condition is met right now. Used to accumulate into
 * EligibleTodayRecord — only ever reports ids to add, never ids to remove.
 */
export function getMetConditionBenefitIds(
  benefits: Benefit[],
  context: BenefitConditionContext,
): string[] {
  return benefits
    .filter((benefit) => isConditionMetNow(benefit.condition, context))
    .map((benefit) => benefit.id);
}

/**
 * True when a benefit's time window has fully closed for today, even though
 * its condition isn't met right now — currently only morning benefits once
 * local time has moved into the afternoon. Distinct from 'locked', which
 * means "not yet, but still might happen today" (afternoon before noon,
 * steps not yet reached). This is a Home-display concept only: it does not
 * feed eligibleToday or completed, which are computed independently via
 * isConditionMetNow/getMetConditionBenefitIds above.
 */
function isConditionExpiredToday(condition: BenefitCondition, now: Date): boolean {
  return condition.type === 'morning' && getLocalTimeOfDay(now) === 'afternoon';
}

/**
 * Ids of benefits Home should stop listing today because their time window
 * has fully closed and they were never completed. Used only to filter
 * Home's visible benefit list — it has no bearing on eligibleToday,
 * completed, or Confirmation.
 */
export function getExpiredBenefitIds(benefits: Benefit[], now: Date = new Date()): string[] {
  return benefits
    .filter((benefit) => isConditionExpiredToday(benefit.condition, now))
    .map((benefit) => benefit.id);
}
