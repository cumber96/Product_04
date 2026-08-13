import type { BenefitAppId } from '../../../domain/benefits/types';

/**
 * iPhone Shortcuts URLs that open each financial app, verified on-device.
 * Web-platform-specific config, not domain data — it depends on Shortcuts
 * automations set up on the user's iPhone, not on app identity itself.
 */
export const APP_LAUNCH_URLS: Record<BenefitAppId, string> = {
  toss: 'supertoss://',
  monimo: 'shortcuts://run-shortcut?name=Product04-Monimo',
  kakaobank: 'shortcuts://run-shortcut?name=Product04-KakaoBank',
};
