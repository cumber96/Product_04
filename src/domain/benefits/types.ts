export type BenefitAppId = 'toss' | 'monimo' | 'kakaobank';

export interface BenefitApp {
  id: BenefitAppId;
  name: string;
}

export type BenefitConditionType =
  | 'daily'
  | 'morning'
  | 'afternoon'
  | 'steps'
  | 'monthly-last-day';

export interface BenefitCondition {
  type: BenefitConditionType;
  steps?: number;
}

export interface Benefit {
  id: string;
  appId: BenefitAppId;
  name: string;
  condition: BenefitCondition;
}

export type BenefitStatus = 'locked' | 'available' | 'completed';

export type BenefitStatusMap = Record<string, BenefitStatus>;
