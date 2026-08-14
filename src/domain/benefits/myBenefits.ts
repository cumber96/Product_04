import type { Benefit, BenefitAppId } from './types';

/**
 * Single source of truth for "the benefits Product 04 actually tracks for
 * this user right now". A benefit only counts if BOTH hold: its app is
 * enabled (enabledAppIds) AND the user has individually kept it in their
 * list (myBenefitIds). Every aggregate (Home's groups, summary total/
 * available, pending confirmation, Confirmation candidates, the widget's
 * pendingBenefitCount) should derive from this rather than re-checking
 * appId/benefit membership itself.
 */
export function getMyBenefits(
  benefits: Benefit[],
  enabledAppIds: ReadonlySet<BenefitAppId>,
  myBenefitIds: ReadonlySet<string>,
): Benefit[] {
  return benefits.filter(
    (benefit) => enabledAppIds.has(benefit.appId) && myBenefitIds.has(benefit.id),
  );
}

export function getMyBenefitIds(
  benefits: Benefit[],
  enabledAppIds: ReadonlySet<BenefitAppId>,
  myBenefitIds: ReadonlySet<string>,
): Set<string> {
  return new Set(getMyBenefits(benefits, enabledAppIds, myBenefitIds).map((benefit) => benefit.id));
}

/**
 * Per-app breakdown for the benefit-management screen, deliberately
 * independent of enabledAppIds — Settings shows an app's benefit count and
 * management entry point even while that app is OFF, so app-level
 * enablement must not factor in here.
 */
export function getMyBenefitsForApp(
  benefits: Benefit[],
  appId: BenefitAppId,
  myBenefitIds: ReadonlySet<string>,
): Benefit[] {
  return benefits.filter((benefit) => benefit.appId === appId && myBenefitIds.has(benefit.id));
}

export function getAddableBenefitsForApp(
  benefits: Benefit[],
  appId: BenefitAppId,
  myBenefitIds: ReadonlySet<string>,
): Benefit[] {
  return benefits.filter((benefit) => benefit.appId === appId && !myBenefitIds.has(benefit.id));
}
