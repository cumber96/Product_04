import { useEffect, useState } from 'react';
import {
  hasConfirmationBeenShownThisSession,
  markConfirmationShown,
} from '../../platform/web/benefits/confirmationSessionStorage';

/**
 * Decides whether Home should show Confirmation automatically instead of
 * its normal body. Fires at most once per browser/PWA session: the moment
 * pendingConfirmationCount is found > 0 (at mount, or after a later
 * reactivation raises it above 0), the session is marked "shown"
 * immediately — before the user opens or finishes Confirmation — so
 * leaving benefits unchecked, or revisiting Home later in the same
 * session, never re-triggers it. A new session (sessionStorage cleared)
 * re-arms this check.
 */
export function useAutoConfirmation(pendingConfirmationCount: number): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (pendingConfirmationCount === 0) return;
    if (hasConfirmationBeenShownThisSession()) return;
    markConfirmationShown();
    setShow(true);
  }, [pendingConfirmationCount]);

  return show;
}
