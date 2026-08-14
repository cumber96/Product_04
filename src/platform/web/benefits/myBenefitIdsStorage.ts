import { BENEFITS } from '../../../domain/benefits/catalog';

const STORAGE_KEY = 'product04:my-benefit-ids';

function getCatalogBenefitIds(): string[] {
  return BENEFITS.map((benefit) => benefit.id);
}

/**
 * A missing key covers two cases that look identical on disk: an existing
 * user who predates this feature, and a brand-new install. Both get the
 * same treatment — snapshot *today's* full catalog and persist it
 * immediately — so that any benefit added to BENEFITS after this snapshot
 * never silently joins an existing selection; it only ever surfaces via a
 * future "혜택 추가" flow. Once the key exists, only its stored value is
 * ever used — this never re-derives from BENEFITS again after the first
 * read.
 */
export function loadMyBenefitIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const snapshot = getCatalogBenefitIds();
      saveMyBenefitIds(new Set(snapshot));
      return snapshot;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

export function saveMyBenefitIds(myBenefitIds: ReadonlySet<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...myBenefitIds]));
}
