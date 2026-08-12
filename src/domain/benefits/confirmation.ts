import type { BenefitAppId } from './types';

/**
 * Snapshot of which benefits were 'available' at the moment a financial app
 * was launched from Product 04. This is an audit log of launches only —
 * Confirmation's candidate set is EligibleTodayRecord minus completed ids,
 * not this snapshot (see domain/benefits/eligibleToday.ts).
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
