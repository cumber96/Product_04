import type { BenefitAppId } from './types';

/**
 * Benefits that were actually 'available' the moment a financial app was
 * launched from Product 04 — the persistent record Confirmation now shows,
 * replacing eligibleToday (which tracked anything merely met at any point
 * today, regardless of whether the user ever visited the app). Local-day
 * scoped: `date` is stamped at creation and used to discard a stale entry
 * rather than carry it into a new day.
 */
export interface PendingConfirmation {
  date: string;
  launchedAt: string;
  benefitIds: string[];
}

export type PendingConfirmationsByApp = Partial<Record<BenefitAppId, PendingConfirmation>>;

/**
 * Adds an app's just-launched available benefits to its pending
 * confirmation. Per policy, an app with zero available benefits at launch
 * never creates (or touches) a pending confirmation — `all` is returned
 * unchanged. A same-day pending already recorded for this app is unioned
 * with (deduped against), not replaced; a pending from a previous day is
 * dropped rather than merged into today's. Other apps' entries are never
 * touched.
 */
export function recordAppLaunchPending(
  all: PendingConfirmationsByApp,
  appId: BenefitAppId,
  availableBenefitIds: string[],
  today: string,
  launchedAt: string,
): PendingConfirmationsByApp {
  if (availableBenefitIds.length === 0) return all;

  const existing = all[appId];
  const base = existing && existing.date === today ? existing.benefitIds : [];
  const benefitIds = Array.from(new Set([...base, ...availableBenefitIds]));

  return { ...all, [appId]: { date: today, launchedAt, benefitIds } };
}

/**
 * Lazy per-entry invalidation, same pattern as eligibleToday's
 * resolveEligibleTodayRecord: an app's pending from a previous local day is
 * dropped at read time rather than carried forward. Does not write
 * anything back by itself.
 */
export function discardStalePendingConfirmations(
  all: PendingConfirmationsByApp,
  today: string,
): PendingConfirmationsByApp {
  const next: PendingConfirmationsByApp = {};
  for (const [appId, pending] of Object.entries(all) as [BenefitAppId, PendingConfirmation][]) {
    if (pending.date === today) next[appId] = pending;
  }
  return next;
}

/** Removes an app's pending confirmation entirely — called once its visit has been handled (confirmed). */
export function clearAppPendingConfirmation(
  all: PendingConfirmationsByApp,
  appId: BenefitAppId,
): PendingConfirmationsByApp {
  if (!(appId in all)) return all;
  const next = { ...all };
  delete next[appId];
  return next;
}
