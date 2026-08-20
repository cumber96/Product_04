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

/** Minimal shape resolveTrustedStoredSteps needs — deliberately not the
 * platform-layer StoredSteps type (platform/web/steps/stepsStorage.ts),
 * since domain code stays storage-agnostic. */
export interface DatedStoredSteps {
  date: string;
  steps: number;
  iphoneSteps: number | null;
}

/**
 * A stored steps record is only a trustworthy same-day fallback when its own
 * `date` matches today. Daily reset deliberately never clears
 * product04:latest-steps (see ensureDailyReset.ts) — a returning user should
 * still see the last steps a Shortcut/app delivered today. But that means a
 * record can sit in storage across a local-day boundary; once the date no
 * longer matches, its steps/iphoneSteps must not be used as "today's last
 * known value" — that's how a prior day's step count used to survive a
 * midnight rollover. A record with no date at all (`''`, see
 * stepsStorage.ts's loadStoredSteps — written before this field existed) is
 * never trusted either, since `''` can never equal a real date string.
 */
export function resolveTrustedStoredSteps(
  stored: DatedStoredSteps | null,
  today: string,
): DatedStoredSteps | null {
  return stored && stored.date === today ? stored : null;
}
