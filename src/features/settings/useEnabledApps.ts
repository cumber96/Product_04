import { useEffect, useState } from 'react';
import type { BenefitAppId } from '../../domain/benefits/types';
import {
  loadEnabledAppIds,
  saveEnabledAppIds,
} from '../../platform/web/benefits/enabledAppsStorage';

/**
 * Source of truth for which apps the user currently has enabled. Persists
 * to product04:enabled-app-ids on every change — never touches completed
 * or eligibleToday storage, so toggling an app off/on never loses or
 * rewrites that data.
 */
export function useEnabledApps() {
  const [enabledAppIds, setEnabledAppIds] = useState<Set<BenefitAppId>>(
    () => new Set(loadEnabledAppIds()),
  );

  useEffect(() => {
    saveEnabledAppIds(enabledAppIds);
  }, [enabledAppIds]);

  function setAppEnabled(appId: BenefitAppId, enabled: boolean): void {
    setEnabledAppIds((prev) => {
      const next = new Set(prev);
      if (enabled) {
        next.add(appId);
      } else {
        next.delete(appId);
      }
      return next;
    });
  }

  return { enabledAppIds, setAppEnabled };
}
