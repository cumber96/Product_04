import { BENEFITS } from '../../domain/benefits/catalog';
import type { BenefitAppId, BenefitStatusMap } from '../../domain/benefits/types';
import { getAvailableBenefitIds } from '../../domain/benefits/benefitStatusStore';
import { createAppLaunchSnapshot } from '../../domain/benefits/confirmation';
import { saveAppLaunchSnapshot } from '../../platform/web/benefits/appLaunchSnapshotStorage';
import { APP_LAUNCH_URLS } from '../../platform/web/benefits/appLaunchUrls';

/**
 * Launching an app snapshots its currently-available benefits before doing
 * anything else. This is an audit log of Product 04 launches only —
 * Confirmation does not read from it; its candidates come from
 * EligibleTodayRecord instead (see domain/benefits/eligibleToday.ts).
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
