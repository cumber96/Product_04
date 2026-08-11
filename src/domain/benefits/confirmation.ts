import type { BenefitAppId } from './types';

/**
 * Snapshot of which benefits were 'available' at the moment a financial app
 * was launched from Product 04. Confirmation must only ever offer benefits
 * from this snapshot, not the app's full benefit list.
 */
export interface AppLaunchSnapshot {
  appId: BenefitAppId;
  launchedAt: string;
  availableBenefitIds: string[];
}

export function createAppLaunchSnapshot(
  appId: BenefitAppId,
  availableBenefitIds: string[],
  launchedAt: string = new Date().toISOString(),
): AppLaunchSnapshot {
  return { appId, launchedAt, availableBenefitIds };
}

/**
 * User's picks from a snapshot on Confirmation — which of the benefits that
 * were available at launch time were actually received.
 */
export interface ConfirmationDraft {
  snapshot: AppLaunchSnapshot;
  selectedBenefitIds: string[];
}

/**
 * Folds a Confirmation's selected benefits into the persisted set of
 * completed benefit ids. This is the only place status should transition
 * to 'completed' once Confirmation UI calls it — matches the shape
 * useBenefitStatuses persists, so it can be applied directly to that state.
 */
export function applyConfirmation(
  completedBenefitIds: ReadonlySet<string>,
  selectedBenefitIds: string[],
): Set<string> {
  return new Set([...completedBenefitIds, ...selectedBenefitIds]);
}
