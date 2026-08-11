const STORAGE_KEY = 'product04:completed-benefit-ids';

export function loadCompletedBenefitIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

export function saveCompletedBenefitIds(completedBenefitIds: ReadonlySet<string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedBenefitIds]));
}
