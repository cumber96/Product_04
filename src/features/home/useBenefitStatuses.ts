import { useEffect, useMemo, useRef, useState } from 'react';
import { BENEFITS } from '../../domain/benefits/catalog';
import { computeStatusMap, getSummary } from '../../domain/benefits/benefitStatusStore';
import { computeBaselineStatus, getExpiredBenefitIds } from '../../domain/benefits/benefitConditionStatus';
import { useLatestSteps } from '../../platform/web/steps/useLatestSteps';
import { usePageReactivation } from '../../platform/web/lifecycle/usePageReactivation';
import {
  loadCompletedBenefitIds,
  saveCompletedBenefitIds,
} from '../../platform/web/benefits/benefitStatusStorage';
import { postWidgetSnapshot } from '../../platform/web/widget/postWidgetSnapshot';
import { useEligibleToday } from './useEligibleToday';

export function useBenefitStatuses() {
  // Ticks when the page becomes usable again without having reloaded (see
  // usePageReactivation) — re-derives steps/baseline/eligibleToday below so
  // returning from a financial app re-evaluates local time/date and steps,
  // not just whatever was true at the original mount.
  const reactivationTick = usePageReactivation();
  const currentSteps = useLatestSteps(reactivationTick);
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

  // Home-display-only: benefits whose time window has fully closed today
  // (currently just morning, once it's afternoon). Does not feed
  // baselineStatus/eligibleToday — see getExpiredBenefitIds.
  const expiredBenefitIds = useMemo(
    () => new Set(getExpiredBenefitIds(BENEFITS)),
    [reactivationTick],
  );

  const statusMap = useMemo(
    () => computeStatusMap(BENEFITS, baselineStatus, completedBenefitIds),
    [baselineStatus, completedBenefitIds],
  );

  const summary = useMemo(() => getSummary(BENEFITS, statusMap), [statusMap]);

  // Widget snapshot: native only needs to hear about this when the
  // available count actually changes, not on every statusMap recompute.
  const pendingBenefitCount = useMemo(
    () => Object.values(statusMap).filter((status) => status === 'available').length,
    [statusMap],
  );
  const lastPostedPendingBenefitCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (lastPostedPendingBenefitCountRef.current === pendingBenefitCount) return;
    lastPostedPendingBenefitCountRef.current = pendingBenefitCount;
    postWidgetSnapshot({ pendingBenefitCount, updatedAt: new Date().toISOString() });
  }, [pendingBenefitCount]);

  return {
    statusMap,
    summary,
    completedBenefitIds,
    setCompletedBenefitIds,
    eligibleTodayBenefitIds,
    expiredBenefitIds,
  };
}
