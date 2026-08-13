import type { BenefitAppId } from '../../../domain/benefits/types';

/**
 * Custom URL schemes that open each financial app directly, verified
 * on-device. Web-platform-specific config, not domain data — it depends on
 * each app's registered scheme, not on app identity itself.
 */
export const APP_LAUNCH_URLS: Record<BenefitAppId, string> = {
  toss: 'supertoss://',
  monimo: 'monimo://',
  kakaobank: 'kakaobank://',
};
