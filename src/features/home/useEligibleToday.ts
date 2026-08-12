import { useEffect, useState } from 'react';
import { BENEFITS } from '../../domain/benefits/catalog';
import { getMetConditionBenefitIds } from '../../domain/benefits/benefitConditionStatus';
import { unionEligibleTodayBenefitIds } from '../../domain/benefits/eligibleToday';
import { getLocalDateString } from '../../domain/date/localDate';
import {
  loadEligibleTodayRecord,
  saveEligibleTodayRecord,
} from '../../platform/web/benefits/eligibleTodayStorage';

/**
 * Accumulates every benefit whose condition is currently met (steps,
 * daily, morning, afternoon, monthly-last-day) into EligibleTodayRecord.
 * Only ever adds ids — a condition that stops being met later in the same
 * local day (steps dropping, morning turning to afternoon) never removes an
 * id already recorded today. Runs on mount, whenever ?steps= changes, and
 * whenever reactivationTick bumps (see usePageReactivation) — the last one
 * is what re-evaluates purely time-based conditions (morning → afternoon,
 * today → the month's last day) when the user returns to a page that was
 * never unloaded, since currentSteps alone wouldn't change in that case.
 */
export function useEligibleToday(currentSteps: number | null, reactivationTick: number): string[] {
  const [record, setRecord] = useState(() => loadEligibleTodayRecord());

  useEffect(() => {
    const now = new Date();
    const metBenefitIds = getMetConditionBenefitIds(BENEFITS, { currentSteps, now });
    if (metBenefitIds.length === 0) return;

    const today = getLocalDateString(now);
    setRecord((prev) => {
      const base = prev.date === today ? prev : loadEligibleTodayRecord(today);
      const next = unionEligibleTodayBenefitIds(base, metBenefitIds);
      if (next !== base) {
        saveEligibleTodayRecord(next);
      }
      return next;
    });
  }, [currentSteps, reactivationTick]);

  return record.benefitIds;
}
