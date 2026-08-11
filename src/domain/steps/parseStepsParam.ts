/**
 * Parses the `steps` value out of a URL query string (e.g. "?steps=6427").
 * Platform-agnostic: takes a plain search string, no DOM access.
 * Returns null when the parameter is missing or not a valid non-negative number.
 */
export function parseStepsParam(search: string): number | null {
  const params = new URLSearchParams(search);
  const raw = params.get('steps');
  if (raw === null) return null;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return null;

  return parsed;
}
