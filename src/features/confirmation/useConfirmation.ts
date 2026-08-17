import { useMemo, useState } from 'react';
import { BENEFIT_APPS, BENEFITS } from '../../domain/benefits/catalog';
import type { Benefit, BenefitApp, BenefitAppId } from '../../domain/benefits/types';
import { applyConfirmation } from '../../domain/benefits/confirmation';
import { clearAppPendingConfirmation } from '../../domain/benefits/pendingConfirmation';
import { getEnabledApps } from '../../domain/benefits/enabledApps';
import { getMyBenefitIds } from '../../domain/benefits/myBenefits';
import { getOrderedApps } from '../../domain/benefits/appOrder';
import { getOrderedBenefits } from '../../domain/benefits/benefitOrder';
import { getLocalDateString } from '../../domain/date/localDate';
import {
  loadPendingConfirmations,
  savePendingConfirmations,
} from '../../platform/web/benefits/pendingConfirmationStorage';
import {
  loadCompletedBenefitIds,
  saveCompletedBenefitIds,
} from '../../platform/web/benefits/benefitStatusStorage';
import { loadEnabledAppIds } from '../../platform/web/benefits/enabledAppsStorage';
import { loadMyBenefitIds } from '../../platform/web/benefits/myBenefitIdsStorage';
import { loadAppOrder } from '../../platform/web/benefits/appOrderStorage';
import { loadBenefitOrder } from '../../platform/web/benefits/benefitOrderStorage';

export interface ConfirmationAppGroup {
  app: BenefitApp;
  benefits: Benefit[];
}

/**
 * Confirmation candidates now come from persistent pending confirmations
 * (see domain/benefits/pendingConfirmation.ts) — benefits that were
 * actually 'available' the moment a financial app was launched — never
 * from eligibleToday (anything merely met at some point today, whether or
 * not the app was ever visited). Scoped to benefits the user currently
 * tracks (enabled app AND kept in myBenefitIds) and not yet completed.
 *
 * `appId` narrows to one app's pending — used by the Home-triggered sheet,
 * which shows at most one app at a time. Omitting it (the standalone
 * /?confirm page) shows every enabled app's pending, unchanged from how
 * that page worked before this shifted to pending-based candidates.
 */
export function useConfirmation(appId?: BenefitAppId) {
  const enabledAppIds = useMemo(() => new Set(loadEnabledAppIds()), []);
  const myBenefitIds = useMemo(() => new Set(loadMyBenefitIds()), []);
  const appOrder = useMemo(() => loadAppOrder(), []);
  const orderedApps = useMemo(() => getOrderedApps(BENEFIT_APPS, appOrder), [appOrder]);
  const benefitOrder = useMemo(() => loadBenefitOrder(), []);
  const enabledApps = useMemo(
    () => getEnabledApps(orderedApps, enabledAppIds),
    [orderedApps, enabledAppIds],
  );
  const myBenefitIdSet = useMemo(
    () => getMyBenefitIds(BENEFITS, enabledAppIds, myBenefitIds),
    [enabledAppIds, myBenefitIds],
  );

  const today = useMemo(() => getLocalDateString(), []);
  const pendingByApp = useMemo(() => loadPendingConfirmations(today), [today]);
  const completedBenefitIds = useMemo(() => loadCompletedBenefitIds(), []);

  const targetApps = useMemo(
    () => (appId ? enabledApps.filter((app) => app.id === appId) : enabledApps),
    [appId, enabledApps],
  );

  const groups = useMemo<ConfirmationAppGroup[]>(() => {
    return targetApps
      .map((app) => {
        const record = pendingByApp[app.id];
        const candidateIds = new Set(
          (record?.benefitIds ?? []).filter(
            (id) => myBenefitIdSet.has(id) && !completedBenefitIds.has(id),
          ),
        );
        const benefits = getOrderedBenefits(
          BENEFITS.filter((benefit) => candidateIds.has(benefit.id)),
          benefitOrder,
        );
        return { app, benefits };
      })
      .filter((group) => group.benefits.length > 0);
  }, [targetApps, pendingByApp, myBenefitIdSet, completedBenefitIds, benefitOrder]);

  const [selectedBenefitIds, setSelectedBenefitIds] = useState<Set<string>>(new Set());

  function toggleBenefit(benefitId: string): void {
    setSelectedBenefitIds((prev) => {
      const next = new Set(prev);
      if (next.has(benefitId)) {
        next.delete(benefitId);
      } else {
        next.add(benefitId);
      }
      return next;
    });
  }

  /**
   * Checked benefits fold into completedBenefitIds (unchanged logic). Every
   * app shown in this Confirmation instance has its pending confirmation
   * cleared entirely — regardless of which of its benefits were actually
   * checked — since "확인 완료" means this app's visit has been handled;
   * an unchecked benefit stays tracked via the live statusMap/completed set
   * exactly as before, it just isn't asked about again for this visit.
   */
  function confirm(): Set<string> {
    const updated = applyConfirmation(loadCompletedBenefitIds(), [...selectedBenefitIds]);
    saveCompletedBenefitIds(updated);

    let pending = loadPendingConfirmations(today);
    for (const group of groups) {
      pending = clearAppPendingConfirmation(pending, group.app.id);
    }
    savePendingConfirmations(pending);

    return updated;
  }

  return { groups, selectedBenefitIds, toggleBenefit, confirm };
}
