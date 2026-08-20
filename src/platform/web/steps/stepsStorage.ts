export interface StoredSteps {
  /**
   * Local-calendar date (see domain/date/localDate.ts) this record's steps
   * were delivered on. Callers must compare this against today before
   * trusting steps/iphoneSteps as a same-day fallback — see useLatestSteps.
   * '' for records written before this field existed (see loadStoredSteps);
   * '' never equals a real getLocalDateString() output, so a legacy record
   * naturally reads as "not today" without any extra branching.
   */
  date: string;
  steps: number;
  /**
   * iPhone-source-only steps, alongside the unified total above. null for
   * records written before this field existed (older app/Shortcut builds
   * that only ever sent `?steps=`) — treated as "not yet known", not as an
   * invalid record, so this migration never wipes a user's last known
   * steps.
   */
  iphoneSteps: number | null;
  updatedAt: string;
}

/**
 * Last steps values a Shortcut/native app ever delivered via ?steps= (and,
 * once available, ?iphoneSteps=), kept so a plain return to this page (no
 * fresh query params — tab switch back from a financial app, or reopening
 * via a bookmark/PWA icon) can fall back to them instead of treating "no
 * query params right now" as "no steps ever". Product 04 never reads
 * HealthKit itself; this only ever trusts values the URL already carried at
 * some point. updatedAt is not shown in the UI yet — it's kept only as a
 * foundation for a future staleness check. date is what actually gates
 * same-day fallback (see useLatestSteps) — updatedAt alone was never
 * validated against "today" before.
 */
const STORAGE_KEY = 'product04:latest-steps';

export function loadStoredSteps(): StoredSteps | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { date, steps, iphoneSteps, updatedAt } = parsed as Partial<StoredSteps>;
    if (typeof steps !== 'number' || typeof updatedAt !== 'string') return null;
    return {
      date: typeof date === 'string' ? date : '',
      steps,
      iphoneSteps: typeof iphoneSteps === 'number' ? iphoneSteps : null,
      updatedAt,
    };
  } catch {
    return null;
  }
}

export function saveStoredSteps(
  steps: number,
  iphoneSteps: number | null,
  date: string,
  updatedAt: string = new Date().toISOString(),
): void {
  const record: StoredSteps = { date, steps, iphoneSteps, updatedAt };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}
