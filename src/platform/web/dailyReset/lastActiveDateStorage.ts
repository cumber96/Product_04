const STORAGE_KEY = 'product04:last-active-date';

/**
 * Missing key means either a brand-new install or an install that predates
 * this feature — both are treated as null by the caller (see
 * domain/date/dailyReset.ts), never as "today".
 */
export function loadLastActiveDate(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveLastActiveDate(date: string): void {
  localStorage.setItem(STORAGE_KEY, date);
}
