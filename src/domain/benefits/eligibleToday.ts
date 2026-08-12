/**
 * Benefit ids that became eligible today (local calendar date), accumulated
 * over the day. This — not any AppLaunchSnapshot — is the source of truth
 * for what Confirmation offers: once an id lands in here, it stays for the
 * rest of the local day even if the condition that earned it (e.g. steps)
 * later stops being met.
 */
export interface EligibleTodayRecord {
  date: string;
  benefitIds: string[];
}

export function createEmptyEligibleTodayRecord(date: string): EligibleTodayRecord {
  return { date, benefitIds: [] };
}

/**
 * Lazy reset: a record from a previous local day is treated as empty rather
 * than being carried forward. Callers persist the result themselves when
 * they have something new to accumulate — this function alone doesn't
 * write anything.
 */
export function resolveEligibleTodayRecord(
  stored: EligibleTodayRecord | null,
  today: string,
): EligibleTodayRecord {
  if (!stored || stored.date !== today) {
    return createEmptyEligibleTodayRecord(today);
  }
  return stored;
}

/**
 * Unions newly-met benefit ids into today's record. Never removes an id —
 * accumulation only grows within a local day.
 */
export function unionEligibleTodayBenefitIds(
  record: EligibleTodayRecord,
  newBenefitIds: string[],
): EligibleTodayRecord {
  const merged = new Set(record.benefitIds);
  let changed = false;
  for (const id of newBenefitIds) {
    if (!merged.has(id)) {
      merged.add(id);
      changed = true;
    }
  }
  return changed ? { date: record.date, benefitIds: [...merged] } : record;
}

/**
 * Confirmation's candidate set: everything eligible today minus what's
 * already been confirmed as completed. Deliberately independent of any
 * app's current locked/available status or of AppLaunchSnapshot.
 */
export function getConfirmationCandidateBenefitIds(
  eligibleTodayBenefitIds: string[],
  completedBenefitIds: ReadonlySet<string>,
): string[] {
  return eligibleTodayBenefitIds.filter((id) => !completedBenefitIds.has(id));
}

/**
 * Ids of benefits actually received today: eligible today AND completed.
 * completedBenefitIds itself has no date scope (it never resets), but every
 * id ever added to it came from a Confirmation candidate — i.e. was in that
 * day's eligibleTodayBenefitIds at the time — so intersecting with today's
 * eligibleTodayBenefitIds is enough to scope it to today without needing
 * any new storage. Complements getConfirmationCandidateBenefitIds above;
 * together the two partition eligibleTodayBenefitIds.
 */
export function getCompletedTodayBenefitIds(
  eligibleTodayBenefitIds: string[],
  completedBenefitIds: ReadonlySet<string>,
): string[] {
  return eligibleTodayBenefitIds.filter((id) => completedBenefitIds.has(id));
}
