/**
 * Pure decision logic for whether a new local day has started and daily
 * state (completedBenefitIds, eligibleToday, pendingConfirmations) needs to
 * be wiped. Takes no storage dependency itself — callers pass in whatever
 * they already loaded so this stays trivially testable.
 */
export interface DailyResetInput {
  /** product04:last-active-date, or null if the key has never been written. */
  savedDate: string | null;
  /**
   * The `date` field of the raw (unresolved) stored eligibleToday record, or
   * null if no record exists at all. Only consulted when savedDate is null —
   * it is the migration signal for pre-existing installs that predate
   * last-active-date.
   */
  eligibleTodayDate: string | null;
  /** Today's local calendar date (see domain/date/localDate.ts). */
  today: string;
}

export interface DailyResetResult {
  /** Whether completed/eligibleToday/pendingConfirmations should be wiped. */
  shouldReset: boolean;
  /** Whether product04:last-active-date needs to be (re)written. */
  shouldStampDate: boolean;
  /** Value to write when shouldStampDate is true — always `today`. */
  nextLastActiveDate: string;
}

/**
 * savedDate === today: same local day as last check, nothing to do.
 *
 * savedDate is a past date: ordinary daily rollover, wipe daily state.
 *
 * savedDate is null (product04:last-active-date has never been written,
 * i.e. this install predates the key): fall back to the existing
 * eligibleToday record's own date rather than blindly wiping, so upgrading
 * mid-day never destroys benefits a user already completed today.
 *   - eligibleTodayDate === today: today's data, keep it, just stamp the date.
 *   - eligibleTodayDate is a past date: stale data, wipe it.
 *   - eligibleTodayDate is null (no record at all): nothing to infer safely,
 *     so don't force-wipe completedBenefitIds — just stamp the date.
 */
export function resolveDailyReset({
  savedDate,
  eligibleTodayDate,
  today,
}: DailyResetInput): DailyResetResult {
  if (savedDate === today) {
    return { shouldReset: false, shouldStampDate: false, nextLastActiveDate: today };
  }

  if (savedDate !== null) {
    return { shouldReset: true, shouldStampDate: true, nextLastActiveDate: today };
  }

  if (eligibleTodayDate === null || eligibleTodayDate === today) {
    return { shouldReset: false, shouldStampDate: true, nextLastActiveDate: today };
  }

  return { shouldReset: true, shouldStampDate: true, nextLastActiveDate: today };
}
