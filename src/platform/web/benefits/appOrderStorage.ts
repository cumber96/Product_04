import { BENEFIT_APPS } from '../../../domain/benefits/catalog';
import type { BenefitAppId } from '../../../domain/benefits/types';

const STORAGE_KEY = 'product04:app-order';

const VALID_APP_IDS: ReadonlySet<string> = new Set(BENEFIT_APPS.map((app) => app.id));

function getCatalogAppOrder(): BenefitAppId[] {
  return BENEFIT_APPS.map((app) => app.id);
}

/**
 * A missing key covers both an existing user (predates this feature) and a
 * brand-new install — both get the same treatment — snapshot *today's*
 * catalog order and persist it immediately, so a later addition to
 * BENEFIT_APPS never rewrites an already-migrated user's saved order; it
 * only ever shows up via getOrderedApps' render-time fallback until the
 * user actually reorders something (see domain/benefits/appOrder.ts).
 */
export function loadAppOrder(): BenefitAppId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const snapshot = getCatalogAppOrder();
      saveAppOrder(snapshot);
      return snapshot;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (id): id is BenefitAppId => typeof id === 'string' && VALID_APP_IDS.has(id),
    );
  } catch {
    return [];
  }
}

export function saveAppOrder(appOrder: readonly BenefitAppId[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appOrder));
}
