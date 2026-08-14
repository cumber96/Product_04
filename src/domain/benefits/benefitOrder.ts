import type { Benefit, BenefitAppId } from './types';

/**
 * Ids of one app's catalog benefits sorted by the given order. Any benefit
 * id not present in order (added to the catalog after this app's order was
 * last saved) falls back to the end, in catalog order — a pure, render-time
 * fallback, not a storage write, mirroring domain/benefits/appOrder.ts.
 */
export function getOrderedBenefitIdsForApp(
  benefits: Benefit[],
  appId: BenefitAppId,
  order: readonly string[],
): string[] {
  const catalogIds = benefits.filter((benefit) => benefit.appId === appId).map((benefit) => benefit.id);
  const orderIndex = new Map(order.map((id, index) => [id, index]));
  return [...catalogIds].sort(
    (a, b) => (orderIndex.get(a) ?? Number.MAX_SAFE_INTEGER) - (orderIndex.get(b) ?? Number.MAX_SAFE_INTEGER),
  );
}

/**
 * Sorts a flat, possibly-multi-app benefit list so that within each app the
 * relative order matches that app's saved benefitOrder — used by Home/
 * Confirmation, which each already segment benefits by app afterward, so
 * cross-app ordering here doesn't matter. Benefit ids not present in any
 * app's saved order (never customized, or newly added to the catalog) keep
 * their original catalog position via a stable sort.
 */
export function getOrderedBenefits(
  benefits: Benefit[],
  benefitOrderByApp: Partial<Record<BenefitAppId, string[]>>,
): Benefit[] {
  const orderIndex = new Map<string, number>();
  for (const order of Object.values(benefitOrderByApp)) {
    order?.forEach((id, index) => orderIndex.set(id, index));
  }
  return [...benefits].sort(
    (a, b) =>
      (orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

/**
 * Swaps benefitId with its adjacent neighbor within one app's order array.
 * No-ops if benefitId is missing or already at the boundary in that
 * direction — mirrors domain/benefits/appOrder.ts's moveAppOrder.
 */
export function moveBenefitOrder(
  order: readonly string[],
  benefitId: string,
  direction: 'up' | 'down',
): string[] {
  const index = order.indexOf(benefitId);
  if (index === -1) return [...order];
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= order.length) return [...order];
  const next = [...order];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}
