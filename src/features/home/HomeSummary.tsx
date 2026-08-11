import type { BenefitSummary } from '../../domain/benefits/benefitStatusStore';

export function HomeSummary({ summary }: { summary: BenefitSummary }) {
  return (
    <header className="home-summary">
      <h1 className="home-summary__title">오늘의 혜택</h1>
      <p className="home-summary__count">
        {summary.completed} / {summary.total}
      </p>
    </header>
  );
}
