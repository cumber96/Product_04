import { useMemo } from 'react';
import type { Benefit, BenefitAppId } from '../../domain/benefits/types';
import { BENEFIT_APPS } from '../../domain/benefits/catalog';
import { getOrderedApps } from '../../domain/benefits/appOrder';
import { getLocalDateString } from '../../domain/date/localDate';
import { loadAppOrder } from '../../platform/web/benefits/appOrderStorage';
import { loadPendingConfirmations } from '../../platform/web/benefits/pendingConfirmationStorage';

export interface PendingConfirmationSummary {
  appId: BenefitAppId;
  launchedAt: string;
  /** Not-yet-completed benefit ids from this app's pending, still tracked (myBenefits) today. */
  benefitIds: string[];
}

export interface PendingConfirmationsState {
  /** App-ordered; only apps with at least one not-yet-completed pending benefit. */
  pending: PendingConfirmationSummary[];
  /** Sum of benefitIds across all pending apps — drives Home's recovery entry, independent of eligibleToday. */
  totalPendingBenefitCount: number;
}

/**
 * Today's persistent pending confirmations — replaces eligibleToday as
 * Confirmation's/Home's source of truth. Only benefits that were actually
 * 'available' at the moment a financial app was launched ever appear here
 * (see useAppLaunch.ts/domain/benefits/pendingConfirmation.ts), scoped to
 * benefits the user still tracks (myBenefits) and not yet completed.
 * Re-reads on every reactivation (reactivationTick) and whenever
 * completedBenefitIds changes, so confirming or dismissing is reflected
 * immediately.
 */
export function usePendingConfirmations(
  myBenefits: Benefit[],
  completedBenefitIds: ReadonlySet<string>,
  reactivationTick: number,
): PendingConfirmationsState {
  return useMemo(() => {
    const myBenefitIdSet = new Set(myBenefits.map((benefit) => benefit.id));
    const today = getLocalDateString();
    const all = loadPendingConfirmations(today);
    const appOrder = loadAppOrder();
    const orderedAppIds = getOrderedApps(BENEFIT_APPS, appOrder).map((app) => app.id);

    const pending: PendingConfirmationSummary[] = [];
    let totalPendingBenefitCount = 0;
    for (const appId of orderedAppIds) {
      const record = all[appId];
      if (!record) continue;
      const benefitIds = record.benefitIds.filter(
        (id) => myBenefitIdSet.has(id) && !completedBenefitIds.has(id),
      );
      if (benefitIds.length === 0) continue;
      pending.push({ appId, launchedAt: record.launchedAt, benefitIds });
      totalPendingBenefitCount += benefitIds.length;
    }
    return { pending, totalPendingBenefitCount };
    // reactivationTick is a re-derive trigger only, not read in the body — same pattern as useBenefitStatuses/expiredBenefitIds.
  }, [myBenefits, completedBenefitIds, reactivationTick]);
}
