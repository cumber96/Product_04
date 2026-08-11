import type { BenefitStatusMap } from '../types';

/**
 * TEST FIXTURE ONLY — not a product rule.
 *
 * Real steps/time-condition evaluation (Step 2) doesn't exist yet, so these
 * hardcoded 'locked' entries exist purely to verify that Home can render
 * all three benefit statuses (locked / available / completed). Which
 * benefits end up locked here has no product meaning and should not be
 * treated as a spec. Benefits omitted here default to 'available'.
 */
export const SEED_BENEFIT_STATUS: BenefitStatusMap = {
  'toss-steps-4000': 'locked',
  'toss-steps-9000': 'locked',
  'monimo-steps-5000': 'locked',
  'kakaobank-steps-4000': 'locked',
  'kakaobank-steps-8000': 'locked',
};
