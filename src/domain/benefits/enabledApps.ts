import type { Benefit, BenefitApp, BenefitAppId } from './types';

export const DEFAULT_ENABLED_APP_IDS: BenefitAppId[] = ['toss', 'monimo', 'kakaobank'];

/**
 * Single source of truth for "which apps/benefits count toward Product 04
 * right now". Every screen (Home, Confirmation, the widget count) should
 * derive its app/benefit list from these rather than re-checking appId
 * membership itself.
 */
export function getEnabledApps(
  apps: BenefitApp[],
  enabledAppIds: ReadonlySet<BenefitAppId>,
): BenefitApp[] {
  return apps.filter((app) => enabledAppIds.has(app.id));
}

export function getEnabledBenefits(
  benefits: Benefit[],
  enabledAppIds: ReadonlySet<BenefitAppId>,
): Benefit[] {
  return benefits.filter((benefit) => enabledAppIds.has(benefit.appId));
}

/**
 * Ids of benefits whose *app* is enabled — deliberately ignores per-benefit
 * selection (myBenefitIds, see ./myBenefits.ts). Named appScoped, not
 * enabled, to keep it visibly distinct from "the benefits the user actually
 * tracks", which also depends on myBenefitIds.
 */
export function getAppScopedBenefitIds(
  benefits: Benefit[],
  enabledAppIds: ReadonlySet<BenefitAppId>,
): Set<string> {
  return new Set(getEnabledBenefits(benefits, enabledAppIds).map((benefit) => benefit.id));
}
