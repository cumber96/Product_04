import { useEffect, useMemo, useState } from 'react';
import { BENEFITS } from '../../domain/benefits/catalog';
import { computeStatusMap, getSummary } from '../../domain/benefits/benefitStatusStore';
import { computeBaselineStatus } from '../../domain/benefits/benefitConditionStatus';
import { useStepsQueryParam } from '../../platform/web/steps/useStepsQueryParam';
import {
  loadCompletedBenefitIds,
  saveCompletedBenefitIds,
} from '../../platform/web/benefits/benefitStatusStorage';
import { useEligibleToday } from './useEligibleToday';

export function useBenefitStatuses() {
  const currentSteps = useStepsQueryParam();
  const [completedBenefitIds, setCompletedBenefitIds] = useState(loadCompletedBenefitIds);

  useEffect(() => {
    saveCompletedBenefitIds(completedBenefitIds);
  }, [completedBenefitIds]);

  // Accumulates steps benefits into EligibleTodayRecord as a side effect.
  // Does not feed into statusMap/summary below — those stay driven purely
  // by the live baseline + completed set, unchanged from before.
  const eligibleTodayBenefitIds = useEligibleToday(currentSteps);

  const baselineStatus = useMemo(
    () => computeBaselineStatus(BENEFITS, { currentSteps }),
    [currentSteps],
  );

  const statusMap = useMemo(
    () => computeStatusMap(BENEFITS, baselineStatus, completedBenefitIds),
    [baselineStatus, completedBenefitIds],
  );

  const summary = useMemo(() => getSummary(BENEFITS, statusMap), [statusMap]);

  return {
    statusMap,
    summary,
    completedBenefitIds,
    setCompletedBenefitIds,
    eligibleTodayBenefitIds,
  };
}
