import { useMemo } from 'react';
import { parseStepsParam } from '../../../domain/steps/parseStepsParam';

/**
 * Web-platform entry point for today's step count: reads it from the current
 * page URL (e.g. /?steps=6427), as delivered by an iPhone Shortcut today and
 * potentially other platforms later. Parsing itself lives in the
 * platform-agnostic domain layer so it can be reused (e.g. Home).
 *
 * reactivationTick re-triggers the read (see usePageReactivation) — the URL
 * itself rarely changes without a full reload, but re-parsing costs nothing
 * and covers bfcache-restored navigations where it does. Defaults to 0 for
 * callers (e.g. the Steps PoC) that just want a one-time read at mount.
 */
export function useStepsQueryParam(reactivationTick = 0): number | null {
  return useMemo(() => parseStepsParam(window.location.search), [reactivationTick]);
}
