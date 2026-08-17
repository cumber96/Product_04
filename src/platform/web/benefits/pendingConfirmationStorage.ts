import type { BenefitAppId } from '../../../domain/benefits/types';
import {
  discardStalePendingConfirmations,
  type PendingConfirmation,
  type PendingConfirmationsByApp,
} from '../../../domain/benefits/pendingConfirmation';
import { getLocalDateString } from '../../../domain/date/localDate';

/**
 * Separate key from app-launch-snapshots (audit log, never consumed) and
 * eligible-today (time/steps-met tracking, no longer read by Confirmation)
 * — this is the only persistent source Confirmation reads from now.
 */
const STORAGE_KEY = 'product04:pending-confirmations';

function isValidPending(value: unknown): value is PendingConfirmation {
  if (typeof value !== 'object' || value === null) return false;
  const { date, launchedAt, benefitIds } = value as Partial<PendingConfirmation>;
  return (
    typeof date === 'string' &&
    typeof launchedAt === 'string' &&
    Array.isArray(benefitIds) &&
    benefitIds.every((id) => typeof id === 'string')
  );
}

function loadRaw(): PendingConfirmationsByApp {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};

    const result: PendingConfirmationsByApp = {};
    for (const [appId, value] of Object.entries(parsed)) {
      if (isValidPending(value)) {
        result[appId as BenefitAppId] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Loads today's pending confirmations, lazily dropping any app's entry from
 * a previous local day. Does not write anything back by itself.
 */
export function loadPendingConfirmations(
  today: string = getLocalDateString(),
): PendingConfirmationsByApp {
  return discardStalePendingConfirmations(loadRaw(), today);
}

export function savePendingConfirmations(all: PendingConfirmationsByApp): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
