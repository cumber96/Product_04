import type { BenefitAppId } from '../../../domain/benefits/types';
import { DEFAULT_ENABLED_APP_IDS } from '../../../domain/benefits/enabledApps';

const STORAGE_KEY = 'product04:enabled-app-ids';

const VALID_APP_IDS: ReadonlySet<string> = new Set(DEFAULT_ENABLED_APP_IDS);

/**
 * A missing key means "never configured" — defaults to every app enabled.
 * A present key (even an empty array, i.e. everything off) is the user's
 * explicit choice and is trusted as-is.
 */
export function loadEnabledAppIds(): BenefitAppId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [...DEFAULT_ENABLED_APP_IDS];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_ENABLED_APP_IDS];
    return parsed.filter(
      (id): id is BenefitAppId => typeof id === 'string' && VALID_APP_IDS.has(id),
    );
  } catch {
    return [...DEFAULT_ENABLED_APP_IDS];
  }
}

export function saveEnabledAppIds(enabledAppIds: ReadonlySet<BenefitAppId>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...enabledAppIds]));
}
