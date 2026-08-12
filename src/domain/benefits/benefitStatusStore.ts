import type { Benefit, BenefitApp, BenefitAppId, BenefitStatus, BenefitStatusMap } from './types';

/**
 * Merges a baseline status (from seed data today, later from real
 * steps/time condition evaluation) with confirmed completions, which always
 * win regardless of what the baseline says.
 */
export function computeStatusMap(
  benefits: Benefit[],
  baselineStatus: BenefitStatusMap,
  completedBenefitIds: ReadonlySet<string>,
): BenefitStatusMap {
  const statusMap: BenefitStatusMap = {};
  for (const benefit of benefits) {
    statusMap[benefit.id] = completedBenefitIds.has(benefit.id)
      ? 'completed'
      : (baselineStatus[benefit.id] ?? 'available');
  }
  return statusMap;
}

export interface BenefitSummary {
  completed: number;
  total: number;
}

export function getSummary(benefits: Benefit[], statusMap: BenefitStatusMap): BenefitSummary {
  const total = benefits.length;
  const completed = benefits.filter((benefit) => statusMap[benefit.id] === 'completed').length;
  return { completed, total };
}

export interface BenefitAppGroup {
  app: BenefitApp;
  benefits: Array<{ benefit: Benefit; status: BenefitStatus }>;
  availableCount: number;
}

/**
 * Groups benefits by app for Home. Completed benefits stay in their app's
 * list (Home is a hub for the app, not just a to-do list), but never count
 * toward availableCount below.
 */
export function getVisibleBenefitGroups(
  apps: BenefitApp[],
  benefits: Benefit[],
  statusMap: BenefitStatusMap,
): BenefitAppGroup[] {
  return apps
    .map((app) => {
      const visibleBenefits = benefits
        .filter((benefit) => benefit.appId === app.id)
        .map((benefit) => ({ benefit, status: statusMap[benefit.id] ?? 'available' }));
      return {
        app,
        benefits: visibleBenefits,
        availableCount: visibleBenefits.filter(({ status }) => status === 'available').length,
      };
    })
    .filter((group) => group.benefits.length > 0);
}

/**
 * IDs of the benefits that are 'available' for one app right now — the set
 * an AppLaunchSnapshot should capture at the moment its app is launched.
 */
export function getAvailableBenefitIds(
  benefits: Benefit[],
  appId: BenefitAppId,
  statusMap: BenefitStatusMap,
): string[] {
  return benefits
    .filter((benefit) => benefit.appId === appId && statusMap[benefit.id] === 'available')
    .map((benefit) => benefit.id);
}
