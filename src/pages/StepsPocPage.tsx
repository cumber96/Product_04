import { StepsDisplay } from '../features/steps/StepsDisplay';
import './StepsPocPage.css';

/**
 * Technical verification screen kept as-is at /steps-poc.
 * Not part of the product UI — Home ("/") is the real MVP entry point.
 */
export function StepsPocPage() {
  return (
    <main className="steps-poc-page">
      <StepsDisplay />
    </main>
  );
}
