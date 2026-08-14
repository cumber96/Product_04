import { useEffect, useMemo, useState } from 'react';
import { BENEFIT_APPS, BENEFITS } from '../../domain/benefits/catalog';
import { getVisibleBenefitGroups } from '../../domain/benefits/benefitStatusStore';
import { getConfirmationCandidateBenefitIds } from '../../domain/benefits/eligibleToday';
import { getEnabledApps } from '../../domain/benefits/enabledApps';
import { getMyBenefitIds, getMyBenefits } from '../../domain/benefits/myBenefits';
import { ConfirmationSheet } from '../confirmation/ConfirmationSheet';
import { useEnabledApps } from '../settings/useEnabledApps';
import { useMyBenefits } from '../settings/useMyBenefits';
import { useBenefitStatuses } from './useBenefitStatuses';
import { useAppLaunch } from './useAppLaunch';
import { useAutoConfirmation } from './useAutoConfirmation';
import { HomeSummary } from './HomeSummary';
import { BenefitAppSection } from './BenefitAppSection';
import './Home.css';

export function Home() {
  // Single source of truth for what's in scope right now: a benefit only
  // counts if its app is enabled AND the user has individually kept it in
  // their list. Every calculation below (groups, summary, pending
  // confirmation) derives from these instead of re-checking membership
  // itself. See domain/benefits/myBenefits.ts.
  const { enabledAppIds } = useEnabledApps();
  const { myBenefitIds } = useMyBenefits();
  const enabledApps = useMemo(
    () => getEnabledApps(BENEFIT_APPS, enabledAppIds),
    [enabledAppIds],
  );
  const myBenefits = useMemo(
    () => getMyBenefits(BENEFITS, enabledAppIds, myBenefitIds),
    [enabledAppIds, myBenefitIds],
  );
  const myBenefitIdSet = useMemo(
    () => getMyBenefitIds(BENEFITS, enabledAppIds, myBenefitIds),
    [enabledAppIds, myBenefitIds],
  );

  const {
    statusMap,
    summary,
    completedBenefitIds,
    setCompletedBenefitIds,
    eligibleTodayBenefitIds,
    expiredBenefitIds,
  } = useBenefitStatuses(myBenefits);
  const { launchApp } = useAppLaunch(statusMap);
  // Expired (time window closed today, e.g. morning once it's afternoon)
  // benefits are dropped before grouping, so Home never lists them as
  // still-lockable. eligibleToday/completed/Confirmation are unaffected —
  // expiredBenefitIds only shapes what Home displays.
  const visibleBenefits = myBenefits.filter((benefit) => !expiredBenefitIds.has(benefit.id));
  const groups = getVisibleBenefitGroups(enabledApps, visibleBenefits, statusMap);
  // eligibleTodayBenefitIds itself is never filtered/mutated — a benefit
  // dropped from myBenefitIds (or its app disabled) stays recorded so
  // bringing it back later restores the correct state. Only this
  // locally-scoped list (what counts toward "미확인 혜택" right now)
  // excludes what's currently out of scope.
  const myEligibleTodayBenefitIds = eligibleTodayBenefitIds.filter((id) =>
    myBenefitIdSet.has(id),
  );
  const pendingConfirmationCount = getConfirmationCandidateBenefitIds(
    myEligibleTodayBenefitIds,
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
      <div className="home__topbar">
        <button
          type="button"
          className="home__settings-button"
          aria-label="설정"
          onClick={() => {
            window.location.href = '?settings';
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
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
