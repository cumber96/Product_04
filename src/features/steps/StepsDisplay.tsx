import { useStepsQueryParam } from '../../platform/web/steps/useStepsQueryParam';
import './StepsDisplay.css';

export function StepsDisplay() {
  const steps = useStepsQueryParam();

  return (
    <section className="steps-display">
      <h1 className="steps-display__title">오늘 걸음 수</h1>
      <p className="steps-display__value">
        {steps !== null ? `${steps.toLocaleString('ko-KR')}보` : '걸음 수 데이터 없음'}
      </p>
    </section>
  );
}
