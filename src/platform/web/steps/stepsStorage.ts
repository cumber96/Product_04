export interface StoredSteps {
  steps: number;
  updatedAt: string;
}

/**
 * Last steps value a Shortcut ever delivered via ?steps=, kept so a plain
 * return to this page (no fresh ?steps= — tab switch back from a financial
 * app, or reopening via a bookmark/PWA icon) can fall back to it instead of
 * treating "no ?steps= right now" as "no steps ever". Product 04 never
 * reads HealthKit itself; this only ever trusts a value the URL already
 * carried at some point. updatedAt is not shown in the UI yet — it's kept
 * only as a foundation for a future staleness check.
 */
const STORAGE_KEY = 'product04:latest-steps';

export function loadStoredSteps(): StoredSteps | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { steps, updatedAt } = parsed as Partial<StoredSteps>;
    if (typeof steps !== 'number' || typeof updatedAt !== 'string') return null;
    return { steps, updatedAt };
  } catch {
    return null;
  }
}

export function saveStoredSteps(steps: number, updatedAt: string = new Date().toISOString()): void {
  const record: StoredSteps = { steps, updatedAt };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}
