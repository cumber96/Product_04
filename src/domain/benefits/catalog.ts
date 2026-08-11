import type { Benefit, BenefitApp } from './types';

export const BENEFIT_APPS: BenefitApp[] = [
  { id: 'toss', name: '토스' },
  { id: 'monimo', name: '모니모' },
  { id: 'kakaobank', name: '카카오뱅크' },
];

export const BENEFITS: Benefit[] = [
  { id: 'toss-lucky-lottery', appId: 'toss', name: '행운복권', condition: { type: 'daily' } },
  { id: 'toss-button-morning', appId: 'toss', name: '버튼 누르기 오전', condition: { type: 'morning' } },
  { id: 'toss-button-afternoon', appId: 'toss', name: '버튼 누르기 오후', condition: { type: 'afternoon' } },
  { id: 'toss-steps-4000', appId: 'toss', name: '만보기 4,000보', condition: { type: 'steps', steps: 4000 } },
  { id: 'toss-steps-9000', appId: 'toss', name: '만보기 9,000보', condition: { type: 'steps', steps: 9000 } },
  { id: 'toss-securities-checkin', appId: 'toss', name: '토스 증권 출석체크', condition: { type: 'daily' } },

  { id: 'monimo-steps-5000', appId: 'monimo', name: '만보기 5,000보', condition: { type: 'steps', steps: 5000 } },
  { id: 'monimo-jelly-exchange', appId: 'monimo', name: '젤리 환전', condition: { type: 'monthly-last-day' } },

  { id: 'kakaobank-steps-1000', appId: 'kakaobank', name: '만보기 1,000보', condition: { type: 'steps', steps: 1000 } },
  { id: 'kakaobank-steps-4000', appId: 'kakaobank', name: '만보기 4,000보', condition: { type: 'steps', steps: 4000 } },
  { id: 'kakaobank-steps-8000', appId: 'kakaobank', name: '만보기 8,000보', condition: { type: 'steps', steps: 8000 } },
];
