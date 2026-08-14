import { BENEFITS } from '../../../domain/benefits/catalog';
import type { BenefitAppId } from '../../../domain/benefits/types';

const STORAGE_KEY = 'product04:benefit-order';

type BenefitOrderMap = Partial<Record<BenefitAppId, string[]>>;

function getCatalogOrderForApp(appId: BenefitAppId): string[] {
  return BENEFITS.filter((benefit) => benefit.appId === appId).map((benefit) => benefit.id);
}

function loadRaw(): BenefitOrderMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const map: BenefitOrderMap = {};
    for (const [appId, order] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(order)) {
        map[appId as BenefitAppId] = order.filter((id): id is string => typeof id === 'string');
      }
    }
    return map;
  } catch {
    return {};
  }
}

/**
 * Read-only, no migration side effect — used by Home/Confirmation, which
 * only ever display order, never edit it. An app with no saved entry here
 * simply has no override; getOrderedBenefits' fallback keeps it in catalog
 * order, so there is nothing to snapshot just for reading.
 */
export function loadBenefitOrder(): BenefitOrderMap {
  return loadRaw();
}

/**
 * Per-app order used by the reorder screen. A missing entry for this app
 * means its order has never been edited — snapshot today's catalog order
 * for just this app and persist immediately, so a benefit added to
 * BENEFITS after this snapshot never silently joins an already-migrated
 * app's order (mirrors platform/web/benefits/appOrderStorage.ts).
 */
export function loadBenefitOrderForApp(appId: BenefitAppId): string[] {
  const all = loadRaw();
  const existing = all[appId];
  if (existing) return existing;
  const snapshot = getCatalogOrderForApp(appId);
  const next: BenefitOrderMap = { ...all, [appId]: snapshot };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return snapshot;
}

export function saveBenefitOrderForApp(appId: BenefitAppId, order: readonly string[]): void {
  const all = loadRaw();
  const next: BenefitOrderMap = { ...all, [appId]: [...order] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
