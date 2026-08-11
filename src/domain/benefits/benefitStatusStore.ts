import type { Benefit, BenefitApp, BenefitStatus, BenefitStatusMap } from './types';

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
}

/**
 * Groups benefits by app for Home, excluding completed ones from each
 * group's list (they still count toward the header summary).
 */
export function getVisibleBenefitGroups(
  apps: BenefitApp[],
  benefits: Benefit[],
  statusMap: BenefitStatusMap,
): BenefitAppGroup[] {
  return apps
    .map((app) => ({
      app,
      benefits: benefits
        .filter((benefit) => benefit.appId === app.id)
        .map((benefit) => ({ benefit, status: statusMap[benefit.id] ?? 'available' }))
        .filter(({ status }) => status !== 'completed'),
    }))
    .filter((group) => group.benefits.length > 0);
}
