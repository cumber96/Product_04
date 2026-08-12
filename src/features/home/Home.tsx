import { BENEFIT_APPS, BENEFITS } from '../../domain/benefits/catalog';
import { getVisibleBenefitGroups } from '../../domain/benefits/benefitStatusStore';
import {
  getConfirmationCandidateBenefitIds,
  getCompletedTodayBenefitIds,
} from '../../domain/benefits/eligibleToday';
import { Confirmation } from '../confirmation/Confirmation';
import { useBenefitStatuses } from './useBenefitStatuses';
import { useAppLaunch } from './useAppLaunch';
import { useAutoConfirmation } from './useAutoConfirmation';
import { HomeSummary } from './HomeSummary';
import { BenefitAppSection } from './BenefitAppSection';
import './Home.css';

export function Home() {
  const { statusMap, summary, completedBenefitIds, eligibleTodayBenefitIds, expiredBenefitIds } =
    useBenefitStatuses();
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
  // Read-only "received today" list: eligible today AND completed. Does not
  // touch the "받을 혜택" grouping above — that still excludes completed
  // benefits exactly as before.
  const completedTodayIds = new Set(
    getCompletedTodayBenefitIds(eligibleTodayBenefitIds, completedBenefitIds),
  );
  const completedTodayBenefits = BENEFITS.filter((benefit) => completedTodayIds.has(benefit.id));

  // Auto-shows Confirmation in place of Home's own body, at most once per
  // session — see useAutoConfirmation. Confirmation's own "확인 완료" button
  // still hard-navigates to '/', so no dismiss callback is needed here.
  const showAutoConfirmation = useAutoConfirmation(pendingConfirmationCount);
  if (showAutoConfirmation) {
    return <Confirmation />;
  }

  return (
    <div className="home">
      <HomeSummary summary={summary} />
      <div className="home__groups">
        {groups.map((group) => (
          <BenefitAppSection key={group.app.id} group={group} onLaunch={launchApp} />
        ))}
      </div>
      {completedTodayBenefits.length > 0 && (
        <section className="completed-today">
          <h2 className="completed-today__title">받은 혜택</h2>
          <ul className="completed-today__list">
            {completedTodayBenefits.map((benefit) => (
              <li key={benefit.id} className="completed-today__item">
                {BENEFIT_APPS.find((app) => app.id === benefit.appId)?.name} · {benefit.name}
              </li>
            ))}
          </ul>
        </section>
      )}
      {/* Manual dev/QA entry point, kept alongside auto-exposure above.
          Bypasses the once-per-session auto gate entirely (no sessionStorage
          read/write here), so QA can re-open Confirmation on demand even
          after the automatic flow has already fired this session. */}
      <a className="home__confirm-link" href="?confirm=1">
        받은 혜택 확인하기{pendingConfirmationCount > 0 ? ` (${pendingConfirmationCount})` : ''}
      </a>
    </div>
  );
}
