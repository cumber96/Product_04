import { BENEFIT_APPS, BENEFITS } from '../../domain/benefits/catalog';
import { getVisibleBenefitGroups } from '../../domain/benefits/benefitStatusStore';
import { useBenefitStatuses } from './useBenefitStatuses';
import { HomeSummary } from './HomeSummary';
import { BenefitAppSection } from './BenefitAppSection';
import './Home.css';

export function Home() {
  const { statusMap, summary } = useBenefitStatuses();
  const groups = getVisibleBenefitGroups(BENEFIT_APPS, BENEFITS, statusMap);

  return (
    <div className="home">
      <HomeSummary summary={summary} />
      <div className="home__groups">
        {groups.map((group) => (
          <BenefitAppSection key={group.app.id} group={group} />
        ))}
      </div>
    </div>
  );
}
