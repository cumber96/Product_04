import { BENEFIT_APPS, BENEFITS } from '../../domain/benefits/catalog';
import { getVisibleBenefitGroups } from '../../domain/benefits/benefitStatusStore';
import { useBenefitStatuses } from './useBenefitStatuses';
import { useAppLaunch } from './useAppLaunch';
import { HomeSummary } from './HomeSummary';
import { BenefitAppSection } from './BenefitAppSection';
import './Home.css';

export function Home() {
  const { statusMap, summary } = useBenefitStatuses();
  const { launchApp } = useAppLaunch(statusMap);
  const groups = getVisibleBenefitGroups(BENEFIT_APPS, BENEFITS, statusMap);

  return (
    <div className="home">
      <HomeSummary summary={summary} />
      <div className="home__groups">
        {groups.map((group) => (
          <BenefitAppSection key={group.app.id} group={group} onLaunch={launchApp} />
        ))}
      </div>
    </div>
  );
}
