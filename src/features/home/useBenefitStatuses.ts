import { useEffect, useMemo, useState } from 'react';
import { BENEFITS } from '../../domain/benefits/catalog';
import { computeStatusMap, getSummary } from '../../domain/benefits/benefitStatusStore';
import { computeStepsBaselineStatus } from '../../domain/benefits/stepsBenefitStatus';
import { useStepsQueryParam } from '../../platform/web/steps/useStepsQueryParam';
import {
  loadCompletedBenefitIds,
  saveCompletedBenefitIds,
} from '../../platform/web/benefits/benefitStatusStorage';

export function useBenefitStatuses() {
  const currentSteps = useStepsQueryParam();
  const [completedBenefitIds, setCompletedBenefitIds] = useState(loadCompletedBenefitIds);

  useEffect(() => {
    saveCompletedBenefitIds(completedBenefitIds);
  }, [completedBenefitIds]);

  const baselineStatus = useMemo(
    () => computeStepsBaselineStatus(BENEFITS, currentSteps),
    [currentSteps],
  );

  const statusMap = useMemo(
    () => computeStatusMap(BENEFITS, baselineStatus, completedBenefitIds),
    [baselineStatus, completedBenefitIds],
  );

  const summary = useMemo(() => getSummary(BENEFITS, statusMap), [statusMap]);

  return { statusMap, summary, completedBenefitIds, setCompletedBenefitIds };
}
