import { useMemo } from 'react';

/**
 * Reads the `steps` URL query parameter (e.g. /?steps=6427).
 * Returns null when the parameter is missing or not a valid non-negative number.
 */
export function useStepsFromQuery(): number | null {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('steps');
    if (raw === null) return null;

    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return null;

    return parsed;
  }, []);
}
