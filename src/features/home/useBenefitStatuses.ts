import { useEffect, useMemo, useState } from 'react';
import { BENEFITS } from '../../domain/benefits/catalog';
import { computeStatusMap, getSummary } from '../../domain/benefits/benefitStatusStore';
import { computeBaselineStatus } from '../../domain/benefits/benefitConditionStatus';
import { useStepsQueryParam } from '../../platform/web/steps/useStepsQueryParam';
import { usePageReactivation } from '../../platform/web/lifecycle/usePageReactivation';
import {
  loadCompletedBenefitIds,
  saveCompletedBenefitIds,
} from '../../platform/web/benefits/benefitStatusStorage';
import { useEligibleToday } from './useEligibleToday';

export function useBenefitStatuses() {
  // Ticks when the page becomes usable again without having reloaded (see
  // usePageReactivation) — re-derives steps/baseline/eligibleToday below so
  // returning from a financial app re-evaluates local time/date and steps,
  // not just whatever was true at the original mount.
  const reactivationTick = usePageReactivation();
  const currentSteps = useStepsQueryParam(reactivationTick);
  const [completedBenefitIds, setCompletedBenefitIds] = useState(loadCompletedBenefitIds);

  useEffect(() => {
    saveCompletedBenefitIds(completedBenefitIds);
  }, [completedBenefitIds]);

  // Accumulates met benefits into EligibleTodayRecord as a side effect.
  // Does not feed into statusMap/summary below — those stay driven purely
  // by the live baseline + completed set, unchanged from before.
  const eligibleTodayBenefitIds = useEligibleToday(currentSteps, reactivationTick);

  const baselineStatus = useMemo(
    () => computeBaselineStatus(BENEFITS, { currentSteps }),
    [currentSteps, reactivationTick],
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
