import { useEffect, useMemo, useState } from 'react';
import { BENEFITS } from '../../domain/benefits/catalog';
import { SEED_BENEFIT_STATUS } from '../../domain/benefits/testFixtures/seedBenefitStatus';
import { computeStatusMap, getSummary } from '../../domain/benefits/benefitStatusStore';
import {
  loadCompletedBenefitIds,
  saveCompletedBenefitIds,
} from '../../platform/web/benefits/benefitStatusStorage';

export function useBenefitStatuses() {
  const [completedBenefitIds, setCompletedBenefitIds] = useState(loadCompletedBenefitIds);

  useEffect(() => {
    saveCompletedBenefitIds(completedBenefitIds);
  }, [completedBenefitIds]);

  const statusMap = useMemo(
    () => computeStatusMap(BENEFITS, SEED_BENEFIT_STATUS, completedBenefitIds),
    [completedBenefitIds],
  );

  const summary = useMemo(() => getSummary(BENEFITS, statusMap), [statusMap]);

  return { statusMap, summary, completedBenefitIds, setCompletedBenefitIds };
}
