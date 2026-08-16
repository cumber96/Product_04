import {
  resolveEligibleTodayRecord,
  type EligibleTodayRecord,
} from '../../../domain/benefits/eligibleToday';
import { getLocalDateString } from '../../../domain/date/localDate';

/**
 * Separate key from both completed-benefit-ids and app-launch-snapshots —
 * eligibleToday tracks what was earned today regardless of which app (if
 * any) was launched, so it must not share persistence with either.
 */
const STORAGE_KEY = 'product04:eligible-today';

function loadRaw(): EligibleTodayRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { date, benefitIds } = parsed as Partial<EligibleTodayRecord>;
    if (typeof date !== 'string' || !Array.isArray(benefitIds)) return null;
    return { date, benefitIds: benefitIds.filter((id): id is string => typeof id === 'string') };
  } catch {
    return null;
  }
}

/**
 * Loads today's record, lazily resetting to empty if the stored record is
 * from a previous local day. Does not write anything back by itself.
 */
export function loadEligibleTodayRecord(
  today: string = getLocalDateString(),
): EligibleTodayRecord {
  return resolveEligibleTodayRecord(loadRaw(), today);
}

export function saveEligibleTodayRecord(record: EligibleTodayRecord): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

/**
 * Reads the stored record's date field as-is, without the "stale record ->
 * today, empty" lazy-reset that loadEligibleTodayRecord applies. Used only
 * by daily-reset migration (see domain/date/dailyReset.ts) to tell "no
 * record at all" apart from "a record from a previous day" without that
 * resolution already collapsing both to the same thing.
 */
export function peekStoredEligibleTodayDate(): string | null {
  return loadRaw()?.date ?? null;
}
