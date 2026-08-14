import type { BenefitApp, BenefitAppId } from './types';

/**
 * Sorts apps by their position in appOrder. Any app id not present in
 * appOrder (a catalog app added after the user's stored order was last
 * written) falls back to the end, in catalog order — this is a pure,
 * render-time fallback, not a storage write, so a growing catalog never
 * silently rewrites a user's saved order on its own.
 */
export function getOrderedApps(
  apps: BenefitApp[],
  appOrder: readonly BenefitAppId[],
): BenefitApp[] {
  const orderIndex = new Map(appOrder.map((id, index) => [id, index]));
  return [...apps].sort((a, b) => {
    const aIndex = orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });
}

export function getOrderedAppIds(
  apps: BenefitApp[],
  appOrder: readonly BenefitAppId[],
): BenefitAppId[] {
  return getOrderedApps(apps, appOrder).map((app) => app.id);
}

/**
 * Swaps appId with its adjacent neighbor. No-ops (returns a copy of
 * appOrder unchanged) if appId is missing or already at the boundary in
 * that direction — callers use this to disable the boundary button instead
 * of relying on the no-op, but it stays safe either way.
 */
export function moveAppOrder(
  appOrder: readonly BenefitAppId[],
  appId: BenefitAppId,
  direction: 'up' | 'down',
): BenefitAppId[] {
  const index = appOrder.indexOf(appId);
  if (index === -1) return [...appOrder];
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= appOrder.length) return [...appOrder];
  const next = [...appOrder];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}
