import { getLocalDateString } from '../../../domain/date/localDate';
import { resolveDailyReset } from '../../../domain/date/dailyReset';
import { createEmptyEligibleTodayRecord } from '../../../domain/benefits/eligibleToday';
import { loadLastActiveDate, saveLastActiveDate } from './lastActiveDateStorage';
import {
  peekStoredEligibleTodayDate,
  saveEligibleTodayRecord,
} from '../benefits/eligibleTodayStorage';
import { saveCompletedBenefitIds } from '../benefits/benefitStatusStorage';
import { clearConfirmationShown } from '../benefits/confirmationSessionStorage';

/**
 * Single entry point for daily-state reset. Must run — synchronously,
 * before anything reads completedBenefitIds/eligibleToday into React state —
 * at every point the app can resume being seen: initial load (called from
 * main.tsx before render) and reactivation (called from
 * platform/web/lifecycle/usePageReactivation.ts before it bumps its tick).
 * Deliberately does not depend on a midnight timer — see domain/date/
 * dailyReset.ts for why a plain date-string comparison on each of those
 * entry points is enough on its own.
 *
 * Wipes exactly: product04:completed-benefit-ids, product04:eligible-today,
 * product04:confirmation-shown. Never touches enabled-app-ids,
 * my-benefit-ids, app-order, benefit-order, or app-launch-snapshots.
 *
 * Returns whether a reset actually happened, so callers that need to force a
 * dependent re-read (e.g. reactivation) can tell "nothing changed" apart
 * from "daily state was just wiped".
 */
export function ensureDailyReset(now: Date = new Date()): boolean {
  const today = getLocalDateString(now);
  const decision = resolveDailyReset({
    savedDate: loadLastActiveDate(),
    eligibleTodayDate: peekStoredEligibleTodayDate(),
    today,
  });

  if (decision.shouldReset) {
    saveCompletedBenefitIds(new Set());
    saveEligibleTodayRecord(createEmptyEligibleTodayRecord(today));
    clearConfirmationShown();
  }

  if (decision.shouldStampDate) {
    saveLastActiveDate(decision.nextLastActiveDate);
  }

  return decision.shouldReset;
}
