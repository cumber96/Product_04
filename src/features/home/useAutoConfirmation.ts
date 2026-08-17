import { useEffect, useRef, useState } from 'react';
import type { BenefitAppId } from '../../domain/benefits/types';

/**
 * Decides when Home should auto-open Confirmation for the next pending app.
 * Auto-shows a given pending at most once per distinct "version" of it —
 * keyed by appId + launchedAt — for the lifetime of this page, not once
 * per calendar day/session: a financial app can legitimately be opened
 * (and re-pend) multiple times in one day, and each of those deserves its
 * own chance to auto-show.
 *
 * Returns a token that increments only when a genuinely new pending
 * signature should trigger an auto-open — callers open the sheet in an
 * effect keyed on this token, so a token that doesn't change (the same
 * pending recurring) never re-triggers, while each distinct new pending
 * does. Dismissing (X) doesn't touch the shown-signatures set, so the same
 * pending won't force itself back open on a later reactivation, but a new
 * launch (different launchedAt) or a different app still gets its own
 * fresh trigger. Multiple reactivation signals firing for the same
 * physical foreground moment (native scenePhase + web
 * visibilitychange/pageshow, see usePageReactivation) are naturally
 * idempotent: the signature is already marked shown after the first one
 * processes, so later ones in the same moment don't bump the token again.
 */
export function useAutoConfirmation(
  pendingAppId: BenefitAppId | null,
  pendingLaunchedAt: string | null,
): number {
  const [showToken, setShowToken] = useState(0);
  const shownSignaturesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (pendingAppId === null || pendingLaunchedAt === null) return;
    const signature = `${pendingAppId}:${pendingLaunchedAt}`;
    if (shownSignaturesRef.current.has(signature)) return;
    shownSignaturesRef.current.add(signature);
    setShowToken((prev) => prev + 1);
  }, [pendingAppId, pendingLaunchedAt]);

  return showToken;
}
