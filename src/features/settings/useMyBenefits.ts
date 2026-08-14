import { useEffect, useState } from 'react';
import { loadMyBenefitIds, saveMyBenefitIds } from '../../platform/web/benefits/myBenefitIdsStorage';

/**
 * Source of truth for which individual benefits the user has kept in their
 * list. Persists to product04:my-benefit-ids on every change — never
 * touches completed or eligibleToday storage, so removing/re-adding a
 * benefit never loses or rewrites that data (see domain/benefits/
 * myBenefits.ts for how this combines with enabledAppIds).
 */
export function useMyBenefits() {
  const [myBenefitIds, setMyBenefitIds] = useState<Set<string>>(
    () => new Set(loadMyBenefitIds()),
  );

  useEffect(() => {
    saveMyBenefitIds(myBenefitIds);
  }, [myBenefitIds]);

  function setBenefitEnabled(benefitId: string, enabled: boolean): void {
    setMyBenefitIds((prev) => {
      const next = new Set(prev);
      if (enabled) {
        next.add(benefitId);
      } else {
        next.delete(benefitId);
      }
      return next;
    });
  }

  return { myBenefitIds, setBenefitEnabled };
}
