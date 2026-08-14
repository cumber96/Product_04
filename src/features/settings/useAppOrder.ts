import { useEffect, useState } from 'react';
import { BENEFIT_APPS } from '../../domain/benefits/catalog';
import type { BenefitAppId } from '../../domain/benefits/types';
import { getOrderedAppIds, moveAppOrder } from '../../domain/benefits/appOrder';
import { loadAppOrder, saveAppOrder } from '../../platform/web/benefits/appOrderStorage';

/**
 * Source of truth for app display order. Persists to product04:app-order on
 * every change — independent of enabledAppIds/myBenefitIds, so toggling an
 * app or editing its benefit list never touches this.
 */
export function useAppOrder() {
  const [appOrder, setAppOrderState] = useState<BenefitAppId[]>(() => loadAppOrder());

  useEffect(() => {
    saveAppOrder(appOrder);
  }, [appOrder]);

  function moveApp(appId: BenefitAppId, direction: 'up' | 'down'): void {
    setAppOrderState((prev) => {
      // Backfill any catalog app missing from the stored order (e.g. added
      // after this user's order was last saved) into its fallback tail
      // position before moving — this is the one point where "the user
      // actually reordered something" turns that fallback into a real,
      // persisted entry.
      const fullOrder = getOrderedAppIds(BENEFIT_APPS, prev);
      return moveAppOrder(fullOrder, appId, direction);
    });
  }

  /**
   * Commits a full order in one shot (used by the drag-reorder preview's
   * "저장하기" action). Persists synchronously — not just via the effect
   * above — because callers may navigate away in the same tick right after
   * calling this (e.g. the leave-confirmation modal saves then immediately
   * follows through on a pending window.location.href navigation).
   */
  function setAppOrder(nextOrder: BenefitAppId[]): void {
    saveAppOrder(nextOrder);
    setAppOrderState(nextOrder);
  }

  return { appOrder, moveApp, setAppOrder };
}
