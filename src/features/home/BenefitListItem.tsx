import type { Benefit, BenefitStatus } from '../../domain/benefits/types';

const STATUS_LABEL: Record<BenefitStatus, string> = {
  locked: '아직 받을 수 없음',
  available: '받을 수 있음',
  completed: '완료',
};

export function BenefitListItem({ benefit, status }: { benefit: Benefit; status: BenefitStatus }) {
  return (
    <li className={`benefit-item benefit-item--${status}`}>
      <span className="benefit-item__name">{benefit.name}</span>
      <span className="benefit-item__status">{STATUS_LABEL[status]}</span>
    </li>
  );
}
