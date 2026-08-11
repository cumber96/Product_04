import { useMemo } from 'react';
import { parseStepsParam } from '../../../domain/steps/parseStepsParam';

/**
 * Web-platform entry point for today's step count: reads it from the current
 * page URL (e.g. /?steps=6427), as delivered by an iPhone Shortcut today and
 * potentially other platforms later. Parsing itself lives in the
 * platform-agnostic domain layer so it can be reused (e.g. Home).
 */
export function useStepsQueryParam(): number | null {
  return useMemo(() => parseStepsParam(window.location.search), []);
}
