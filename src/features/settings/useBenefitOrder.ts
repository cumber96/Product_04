import { useEffect, useState } from 'react';
import type { BenefitAppId } from '../../domain/benefits/types';
import {
  loadBenefitOrderForApp,
  saveBenefitOrderForApp,
} from '../../platform/web/benefits/benefitOrderStorage';

/**
 * Source of truth for one app's benefit display order. Persists to
 * product04:benefit-order on every change — independent of myBenefitIds/
 * enabledAppIds/appOrder, so removing/re-adding a benefit or toggling an
 * app never touches this (mirrors useAppOrder.ts).
 */
export function useBenefitOrder(appId: BenefitAppId) {
  const [benefitOrder, setBenefitOrderState] = useState<string[]>(() =>
    loadBenefitOrderForApp(appId),
  );

  useEffect(() => {
    saveBenefitOrderForApp(appId, benefitOrder);
  }, [appId, benefitOrder]);

  /**
   * Commits a full order in one shot (used by the drag-reorder preview's
   * "저장하기" action). Persists synchronously — not just via the effect
   * above — because callers may navigate away in the same tick right after
   * calling this (mirrors useAppOrder.ts's setAppOrder).
   */
  function setBenefitOrder(nextOrder: string[]): void {
    saveBenefitOrderForApp(appId, nextOrder);
    setBenefitOrderState(nextOrder);
  }

  return { benefitOrder, setBenefitOrder };
}
