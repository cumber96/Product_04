import { BENEFIT_APPS, BENEFITS } from '../../domain/benefits/catalog';
import { getVisibleBenefitGroups } from '../../domain/benefits/benefitStatusStore';
import { getConfirmationCandidateBenefitIds } from '../../domain/benefits/eligibleToday';
import { useBenefitStatuses } from './useBenefitStatuses';
import { useAppLaunch } from './useAppLaunch';
import { HomeSummary } from './HomeSummary';
import { BenefitAppSection } from './BenefitAppSection';
import './Home.css';

export function Home() {
  const { statusMap, summary, completedBenefitIds, eligibleTodayBenefitIds } =
    useBenefitStatuses();
  const { launchApp } = useAppLaunch(statusMap);
  const groups = getVisibleBenefitGroups(BENEFIT_APPS, BENEFITS, statusMap);
  const pendingConfirmationCount = getConfirmationCandidateBenefitIds(
    eligibleTodayBenefitIds,
    completedBenefitIds,
  ).length;

  return (
    <div className="home">
      <HomeSummary summary={summary} />
      <div className="home__groups">
        {groups.map((group) => (
          <BenefitAppSection key={group.app.id} group={group} onLaunch={launchApp} />
        ))}
      </div>
      {/* Temporary dev/QA entry point for Confirmation until app return is
          auto-detected. Candidate calculation itself is app-independent —
          this link just navigates there. */}
      <a className="home__confirm-link" href="?confirm=1">
        받은 혜택 확인하기{pendingConfirmationCount > 0 ? ` (${pendingConfirmationCount})` : ''}
      </a>
    </div>
  );
}
