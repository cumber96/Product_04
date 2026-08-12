import { BENEFITS } from '../../domain/benefits/catalog';
import type { BenefitAppId, BenefitStatusMap } from '../../domain/benefits/types';
import { getAvailableBenefitIds } from '../../domain/benefits/benefitStatusStore';
import { createAppLaunchSnapshot } from '../../domain/benefits/confirmation';
import { saveAppLaunchSnapshot } from '../../platform/web/benefits/appLaunchSnapshotStorage';
import { APP_LAUNCH_URLS } from '../../platform/web/benefits/appLaunchUrls';

/**
 * Launching an app snapshots its currently-available benefits before doing
 * anything else, so Confirmation (Step 4) always sees what was available at
 * launch time even if steps/time conditions change while the user is away.
 * The snapshot save must complete before navigating away to the app.
 */
export function useAppLaunch(statusMap: BenefitStatusMap) {
  function launchApp(appId: BenefitAppId): void {
    const availableBenefitIds = getAvailableBenefitIds(BENEFITS, appId, statusMap);
    const snapshot = createAppLaunchSnapshot(appId, availableBenefitIds);
    saveAppLaunchSnapshot(snapshot);

    window.location.href = APP_LAUNCH_URLS[appId];
  }

  return { launchApp };
}
