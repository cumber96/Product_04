import { useMemo, useState } from 'react';
import { BENEFIT_APPS, BENEFITS } from '../../domain/benefits/catalog';
import type { Benefit, BenefitApp } from '../../domain/benefits/types';
import { applyConfirmation } from '../../domain/benefits/confirmation';
import { getConfirmationCandidateBenefitIds } from '../../domain/benefits/eligibleToday';
import { getLocalDateString } from '../../domain/date/localDate';
import { loadEligibleTodayRecord } from '../../platform/web/benefits/eligibleTodayStorage';
import {
  loadCompletedBenefitIds,
  saveCompletedBenefitIds,
} from '../../platform/web/benefits/benefitStatusStorage';

export interface ConfirmationAppGroup {
  app: BenefitApp;
  benefits: Benefit[];
}

/**
 * Confirmation candidates = eligibleTodayBenefitIds - completedBenefitIds.
 * Deliberately does not touch AppLaunchSnapshot or recompute the live
 * locked/available statusMap — those are separate concerns (audit log and
 * Home's real-time display, respectively), not candidate sources here.
 */
export function useConfirmation() {
  const eligibleTodayBenefitIds = useMemo(
    () => loadEligibleTodayRecord(getLocalDateString()).benefitIds,
    [],
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
      BENEFIT_APPS.map((app) => ({
        app,
        benefits: candidateBenefits.filter((benefit) => benefit.appId === app.id),
      })).filter((group) => group.benefits.length > 0),
    [candidateBenefits],
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
