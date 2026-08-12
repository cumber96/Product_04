import { useEffect, useState } from 'react';
import { BENEFIT_APPS, BENEFITS } from '../../domain/benefits/catalog';
import { getVisibleBenefitGroups } from '../../domain/benefits/benefitStatusStore';
import { getConfirmationCandidateBenefitIds } from '../../domain/benefits/eligibleToday';
import { ConfirmationSheet } from '../confirmation/ConfirmationSheet';
import { useBenefitStatuses } from './useBenefitStatuses';
import { useAppLaunch } from './useAppLaunch';
import { useAutoConfirmation } from './useAutoConfirmation';
import { HomeSummary } from './HomeSummary';
import { BenefitAppSection } from './BenefitAppSection';
import './Home.css';

export function Home() {
  const {
    statusMap,
    summary,
    completedBenefitIds,
    setCompletedBenefitIds,
    eligibleTodayBenefitIds,
    expiredBenefitIds,
  } = useBenefitStatuses();
  const { launchApp } = useAppLaunch(statusMap);
  // Expired (time window closed today, e.g. morning once it's afternoon)
  // benefits are dropped before grouping, so Home never lists them as
  // still-lockable. eligibleToday/completed/Confirmation are unaffected —
  // expiredBenefitIds only shapes what Home displays.
  const visibleBenefits = BENEFITS.filter((benefit) => !expiredBenefitIds.has(benefit.id));
  const groups = getVisibleBenefitGroups(BENEFIT_APPS, visibleBenefits, statusMap);
  const pendingConfirmationCount = getConfirmationCandidateBenefitIds(
    eligibleTodayBenefitIds,
    completedBenefitIds,
  ).length;

  // useAutoConfirmation only ever flips true, at most once per session — it
  // is purely a trigger to open the sheet, not the sheet's open/close state
  // itself, so the sheet can still be closed and reopened manually after.
  const showAutoConfirmation = useAutoConfirmation(pendingConfirmationCount);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  useEffect(() => {
    if (showAutoConfirmation) {
      setIsSheetOpen(true);
    }
  }, [showAutoConfirmation]);

  function handleConfirmed(updatedCompletedBenefitIds: Set<string>) {
    setIsSheetOpen(false);
    setCompletedBenefitIds(updatedCompletedBenefitIds);
  }

  return (
    <div className="home">
      <HomeSummary summary={summary} />
      {pendingConfirmationCount > 0 && (
        <button
          type="button"
          className="home__pending-entry"
          onClick={() => setIsSheetOpen(true)}
        >
          <span>미확인 혜택 {pendingConfirmationCount}개 확인하기</span>
          <span aria-hidden="true">›</span>
        </button>
      )}
      <div className="home__groups">
        {groups.map((group) => (
          <BenefitAppSection key={group.app.id} group={group} onLaunch={launchApp} />
        ))}
      </div>
      {isSheetOpen && (
        <ConfirmationSheet onClose={() => setIsSheetOpen(false)} onConfirmed={handleConfirmed} />
      )}
    </div>
  );
}
