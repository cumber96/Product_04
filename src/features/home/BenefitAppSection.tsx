import type { BenefitAppGroup } from '../../domain/benefits/benefitStatusStore';
import type { BenefitAppId } from '../../domain/benefits/types';
import { BenefitListItem } from './BenefitListItem';

export function BenefitAppSection({
  group,
  onLaunch,
}: {
  group: BenefitAppGroup;
  onLaunch: (appId: BenefitAppId) => void;
}) {
  return (
    <section className="benefit-app-section">
      <h2 className="benefit-app-section__title">{group.app.name}</h2>
      <p className="benefit-app-section__available-count">
        현재 받을 수 있는 혜택 {group.availableCount}개
      </p>
      <ul className="benefit-app-section__list">
        {group.benefits.map(({ benefit, status }) => (
          <BenefitListItem key={benefit.id} benefit={benefit} status={status} />
        ))}
      </ul>
      <button
        type="button"
        className="benefit-app-section__launch-button"
        onClick={() => onLaunch(group.app.id)}
        disabled={group.availableCount === 0}
      >
        {group.app.name} 열기
      </button>
    </section>
  );
}
