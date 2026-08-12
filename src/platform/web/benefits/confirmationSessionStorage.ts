/**
 * sessionStorage, not localStorage — this flag's only job is "has automatic
 * Confirmation already been shown in this browser/PWA session". It must
 * reset when the tab/PWA session ends, unlike eligibleToday/completed
 * (product04:eligible-today, product04:completed-benefit-ids) which persist
 * across sessions in localStorage.
 */
const STORAGE_KEY = 'product04:confirmation-shown';

export function hasConfirmationBeenShownThisSession(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markConfirmationShown(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // sessionStorage unavailable (e.g. private mode) — auto-show just
    // won't remember it fired; not fatal.
  }
}
