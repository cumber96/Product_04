import { useMemo, useState } from 'react';
import { BENEFIT_APPS, BENEFITS } from '../../domain/benefits/catalog';
import type { Benefit, BenefitApp } from '../../domain/benefits/types';
import { applyConfirmation } from '../../domain/benefits/confirmation';
import { getConfirmationCandidateBenefitIds } from '../../domain/benefits/eligibleToday';
import { getEnabledApps } from '../../domain/benefits/enabledApps';
import { getMyBenefitIds } from '../../domain/benefits/myBenefits';
import { getLocalDateString } from '../../domain/date/localDate';
import { loadEligibleTodayRecord } from '../../platform/web/benefits/eligibleTodayStorage';
import {
  loadCompletedBenefitIds,
  saveCompletedBenefitIds,
} from '../../platform/web/benefits/benefitStatusStorage';
import { loadEnabledAppIds } from '../../platform/web/benefits/enabledAppsStorage';
import { loadMyBenefitIds } from '../../platform/web/benefits/myBenefitIdsStorage';

export interface ConfirmationAppGroup {
  app: BenefitApp;
  benefits: Benefit[];
}

/**
 * Confirmation candidates = eligibleTodayBenefitIds - completedBenefitIds,
 * scoped to the benefits the user currently tracks (enabled app AND kept in
 * myBenefitIds — see domain/benefits/myBenefits.ts). Deliberately does not
 * touch AppLaunchSnapshot or recompute the live locked/available statusMap
 * — those are separate concerns (audit log and Home's real-time display,
 * respectively), not candidate sources here. eligibleTodayBenefitIds itself
 * is loaded and used as-is (never filtered in storage) — anything currently
 * out of scope just doesn't make it into candidateBenefits below.
 */
export function useConfirmation() {
  const enabledAppIds = useMemo(() => new Set(loadEnabledAppIds()), []);
  const myBenefitIds = useMemo(() => new Set(loadMyBenefitIds()), []);
  const enabledApps = useMemo(() => getEnabledApps(BENEFIT_APPS, enabledAppIds), [enabledAppIds]);
  const myBenefitIdSet = useMemo(
    () => getMyBenefitIds(BENEFITS, enabledAppIds, myBenefitIds),
    [enabledAppIds, myBenefitIds],
  );

  const eligibleTodayBenefitIds = useMemo(
    () =>
      loadEligibleTodayRecord(getLocalDateString()).benefitIds.filter((id) =>
        myBenefitIdSet.has(id),
      ),
    [myBenefitIdSet],
  );
  const completedBenefitIds = useMemo(() => loadCompletedBenefitIds(), []);

  const candidateBenefits = useMemo(() => {
    const candidateIds = new Set(
      getConfirmationCandidateBenefitIds(eligibleTodayBenefitIds, completedBenefitIds),
    );
    return BENEFITS.filter((benefit) => candidateIds.has(benefit.id));
  }, [eligibleTodayBenefitIds, completedBenefitIds]);

  const groups = useMemo<ConfirmationAppGroup[]>(
    () =>
      enabledApps.map((app) => ({
        app,
        benefits: candidateBenefits.filter((benefit) => benefit.appId === app.id),
      })).filter((group) => group.benefits.length > 0),
    [enabledApps, candidateBenefits],
  );

  const [selectedBenefitIds, setSelectedBenefitIds] = useState<Set<string>>(new Set());

  function toggleBenefit(benefitId: string): void {
    setSelectedBenefitIds((prev) => {
      const next = new Set(prev);
      if (next.has(benefitId)) {
        next.delete(benefitId);
      } else {
        next.add(benefitId);
      }
      return next;
    });
  }

  function confirm(): Set<string> {
    const updated = applyConfirmation(loadCompletedBenefitIds(), [...selectedBenefitIds]);
    saveCompletedBenefitIds(updated);
    return updated;
  }

  return { groups, selectedBenefitIds, toggleBenefit, confirm };
}
