/**
 * Parses the `iphoneSteps` value out of a URL query string (e.g.
 * "?steps=6427&iphoneSteps=2303") — the iPhone-source-only counterpart to
 * `steps` delivered by parseStepsParam. Returns null when the parameter is
 * missing (e.g. a legacy Shortcut/app build that only ever sends `?steps=`)
 * or not a valid non-negative number; callers must not treat that as 0.
 */
export function parseIphoneStepsParam(search: string): number | null {
  const params = new URLSearchParams(search);
  const raw = params.get('iphoneSteps');
  if (raw === null) return null;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return null;

  return parsed;
}
