/**
 * The steps value the app should actually use right now: a fresh URL value
 * always wins — even if lower than what was previously known, since a
 * genuinely new Shortcut run is authoritative — and only falls back to the
 * last value a Shortcut ever delivered when the URL carries none at all
 * (a plain return to this page, not a new entry via Shortcut).
 */
export function resolveCurrentSteps(
  urlSteps: number | null,
  lastKnownSteps: number | null,
): number | null {
  return urlSteps !== null ? urlSteps : lastKnownSteps;
}
