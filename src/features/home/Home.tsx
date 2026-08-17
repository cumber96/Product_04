import { useEffect, useMemo, useState } from 'react';
import { BENEFIT_APPS, BENEFITS } from '../../domain/benefits/catalog';
import { getVisibleBenefitGroups } from '../../domain/benefits/benefitStatusStore';
import { getEnabledApps } from '../../domain/benefits/enabledApps';
import { getMyBenefits } from '../../domain/benefits/myBenefits';
import { getOrderedApps } from '../../domain/benefits/appOrder';
import { getOrderedBenefits } from '../../domain/benefits/benefitOrder';
import { loadBenefitOrder } from '../../platform/web/benefits/benefitOrderStorage';
import { ConfirmationSheet } from '../confirmation/ConfirmationSheet';
import { useEnabledApps } from '../settings/useEnabledApps';
import { useMyBenefits } from '../settings/useMyBenefits';
import { useAppOrder } from '../settings/useAppOrder';
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
  const { appOrder } = useAppOrder();
  const orderedApps = useMemo(
    () => getOrderedApps(BENEFIT_APPS, appOrder),
    [appOrder],
  );
  const enabledApps = useMemo(
    () => getEnabledApps(orderedApps, enabledAppIds),
    [orderedApps, enabledAppIds],
  );
  // Read-only, one-time load — nothing on this page writes benefit order,
  // it's only ever edited from the per-app benefit management screen.
  const benefitOrder = useMemo(() => loadBenefitOrder(), []);
  const myBenefits = useMemo(
    () => getOrderedBenefits(getMyBenefits(BENEFITS, enabledAppIds, myBenefitIds), benefitOrder),
    [enabledAppIds, myBenefitIds, benefitOrder],
  );

  const {
    statusMap,
    summary,
    setCompletedBenefitIds,
    pending,
    totalPendingBenefitCount,
    expiredBenefitIds,
  } = useBenefitStatuses(myBenefits);
  const { launchApp } = useAppLaunch(statusMap);
  // Expired (time window closed today, e.g. morning once it's afternoon)
  // benefits are dropped before grouping, so Home never lists them as
  // still-lockable. pending/completed/Confirmation are unaffected —
  // expiredBenefitIds only shapes what Home displays.
  const visibleBenefits = myBenefits.filter((benefit) => !expiredBenefitIds.has(benefit.id));
  const groups = getVisibleBenefitGroups(enabledApps, visibleBenefits, statusMap);

  // Confirmation shows one app at a time — the first (app-ordered) app
  // that still has an unconfirmed pending. Completing or dismissing it
  // never removes other apps' pending (see domain/benefits/
  // pendingConfirmation.ts), so the next one naturally becomes "next"
  // once this one is cleared.
  const nextPending = pending[0] ?? null;

  // Bumps only when a genuinely new pending (new app, or the same app
  // re-launched) should get its own chance to auto-open — see
  // useAutoConfirmation. Not tied to eligibleToday, session, or calendar
  // day; the sheet can still be closed and reopened manually afterward via
  // the recovery entry below.
  const autoConfirmationToken = useAutoConfirmation(
    nextPending?.appId ?? null,
    nextPending?.launchedAt ?? null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  useEffect(() => {
    if (autoConfirmationToken > 0) {
      setIsSheetOpen(true);
    }
  }, [autoConfirmationToken]);

  function handleConfirmed(updatedCompletedBenefitIds: Set<string>) {
    setIsSheetOpen(false);
    setCompletedBenefitIds(updatedCompletedBenefitIds);
  }

  return (
    <div className="home">
      <HomeSummary summary={summary} />
      {totalPendingBenefitCount > 0 && (
        <button
          type="button"
          className="home__pending-entry"
          onClick={() => setIsSheetOpen(true)}
        >
          <span>미확인 혜택 {totalPendingBenefitCount}개 확인하기</span>
          <span aria-hidden="true">›</span>
        </button>
      )}
      <div className="home__groups">
        {groups.map((group) => (
          <BenefitAppSection key={group.app.id} group={group} onLaunch={launchApp} />
        ))}
      </div>
      {isSheetOpen && nextPending && (
        <ConfirmationSheet
          appId={nextPending.appId}
          onClose={() => setIsSheetOpen(false)}
          onConfirmed={handleConfirmed}
        />
      )}
      <div className="home__floating-action-container">
        <div className="home__action-bar-fade" aria-hidden="true" />
        <div className="home__action-bar">
          <button
            type="button"
            className="home__action-bar-button"
            onClick={() => {
              window.location.href = '?settings=apps';
            }}
          >
            <svg
              className="home__action-bar-icon"
              viewBox="0 0 24 24"
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
            <span>혜택 편집하기</span>
          </button>
          <div className="home__action-bar-divider" aria-hidden="true" />
          <button
            type="button"
            className="home__action-bar-button"
            onClick={() => {
              window.location.href = '?add-benefit';
            }}
          >
            <svg
              className="home__action-bar-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>혜택 추가하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
