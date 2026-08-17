import type { BenefitAppId } from './types';

export interface StepsByPlatform {
  /** HealthKit unified/total step count. */
  steps: number | null;
  /** iPhone-source-only step count; null when unavailable. */
  iphoneSteps: number | null;
}

/**
 * Which steps value a benefit's `steps` condition should be evaluated
 * against, per app. toss/kakaobank use iphoneSteps, falling back to the
 * unified `steps` total when iphoneSteps is unavailable (a legacy
 * Shortcut/app delivery that predates it, so the app keeps working instead
 * of locking every steps benefit). monimo keeps using the unified total
 * unchanged — it never depended on iphoneSteps.
 */
export function resolveStepsForApp(appId: BenefitAppId, values: StepsByPlatform): number | null {
  switch (appId) {
    case 'toss':
    case 'kakaobank':
      return values.iphoneSteps ?? values.steps;
    case 'monimo':
      return values.steps;
  }
}
