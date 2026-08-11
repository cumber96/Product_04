import type { BenefitAppGroup } from '../../domain/benefits/benefitStatusStore';
import { BenefitListItem } from './BenefitListItem';

export function BenefitAppSection({ group }: { group: BenefitAppGroup }) {
  return (
    <section className="benefit-app-section">
      <h2 className="benefit-app-section__title">{group.app.name}</h2>
      <ul className="benefit-app-section__list">
        {group.benefits.map(({ benefit, status }) => (
          <BenefitListItem key={benefit.id} benefit={benefit} status={status} />
        ))}
      </ul>
    </section>
  );
}
