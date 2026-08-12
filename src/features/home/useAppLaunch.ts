import { BENEFITS } from '../../domain/benefits/catalog';
import type { BenefitAppId, BenefitStatusMap } from '../../domain/benefits/types';
import { getAvailableBenefitIds } from '../../domain/benefits/benefitStatusStore';
import { createAppLaunchSnapshot } from '../../domain/benefits/confirmation';
import { saveAppLaunchSnapshot } from '../../platform/web/benefits/appLaunchSnapshotStorage';

/**
 * Launching an app snapshots its currently-available benefits before doing
 * anything else, so Confirmation (Step 4) always sees what was available at
 * launch time even if steps/time conditions change while the user is away.
 */
export function useAppLaunch(statusMap: BenefitStatusMap) {
  function launchApp(appId: BenefitAppId): void {
    const availableBenefitIds = getAvailableBenefitIds(BENEFITS, appId, statusMap);
    const snapshot = createAppLaunchSnapshot(appId, availableBenefitIds);
    saveAppLaunchSnapshot(snapshot);

    // TODO(Step 3.4): navigate to the financial app's official URL
    // scheme / universal link once it is confirmed — see Step 3 report.
  }

  return { launchApp };
}
