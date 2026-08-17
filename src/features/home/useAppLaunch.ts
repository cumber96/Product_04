import { BENEFITS } from '../../domain/benefits/catalog';
import type { BenefitAppId, BenefitStatusMap } from '../../domain/benefits/types';
import { getAvailableBenefitIds } from '../../domain/benefits/benefitStatusStore';
import { createAppLaunchSnapshot } from '../../domain/benefits/confirmation';
import { recordAppLaunchPending } from '../../domain/benefits/pendingConfirmation';
import { getLocalDateString } from '../../domain/date/localDate';
import { saveAppLaunchSnapshot } from '../../platform/web/benefits/appLaunchSnapshotStorage';
import {
  loadPendingConfirmations,
  savePendingConfirmations,
} from '../../platform/web/benefits/pendingConfirmationStorage';
import { APP_LAUNCH_URLS } from '../../platform/web/benefits/appLaunchUrls';

/**
 * Launching an app snapshots its currently-available benefits before doing
 * anything else, and — only when there's at least one — records a
 * persistent pending confirmation for that app (see
 * domain/benefits/pendingConfirmation.ts). This is the only place a pending
 * confirmation is ever created; it's what Confirmation now reads from,
 * replacing eligibleToday. The AppLaunchSnapshot save is unchanged, still a
 * launches-only audit log Confirmation never reads.
 * Both saves must complete before navigating away to the app.
 */
export function useAppLaunch(statusMap: BenefitStatusMap) {
  function launchApp(appId: BenefitAppId): void {
    const availableBenefitIds = getAvailableBenefitIds(BENEFITS, appId, statusMap);

    const snapshot = createAppLaunchSnapshot(appId, availableBenefitIds);
    saveAppLaunchSnapshot(snapshot);

    const today = getLocalDateString();
    const launchedAt = new Date().toISOString();
    const pending = recordAppLaunchPending(
      loadPendingConfirmations(today),
      appId,
      availableBenefitIds,
      today,
      launchedAt,
    );
    savePendingConfirmations(pending);

    window.location.href = APP_LAUNCH_URLS[appId];
  }

  return { launchApp };
}
