import { useMemo, useState } from 'react';
import { BENEFITS, BENEFIT_APPS } from '../../domain/benefits/catalog';
import type { BenefitAppId } from '../../domain/benefits/types';
import { getAddableBenefitsForApp, getMyBenefitsForApp } from '../../domain/benefits/myBenefits';
import { useMyBenefits } from './useMyBenefits';
import { ScreenHeader } from './ScreenHeader';
import './Settings.css';
import './BenefitManagement.css';

type Mode = 'list' | 'add';

export function BenefitManagement({ appId }: { appId: BenefitAppId }) {
  const app = BENEFIT_APPS.find((candidate) => candidate.id === appId)!;
  const { myBenefitIds, setBenefitEnabled } = useMyBenefits();
  const [mode, setMode] = useState<Mode>('list');

  const myBenefits = useMemo(
    () => getMyBenefitsForApp(BENEFITS, appId, myBenefitIds),
    [appId, myBenefitIds],
  );
  const addableBenefits = useMemo(
    () => getAddableBenefitsForApp(BENEFITS, appId, myBenefitIds),
    [appId, myBenefitIds],
  );

  if (mode === 'add') {
    return (
      <div className="settings">
        <ScreenHeader title={`${app.name} 혜택 추가`} onBack={() => setMode('list')} />
        {addableBenefits.length === 0 ? (
          <p className="benefit-management__empty">추가할 수 있는 혜택이 없습니다.</p>
        ) : (
          <ul className="benefit-management__list">
            {addableBenefits.map((benefit) => (
              <li key={benefit.id} className="benefit-management__row">
                <span className="benefit-management__name">{benefit.name}</span>
                <button
                  type="button"
                  className="benefit-management__add"
                  onClick={() => setBenefitEnabled(benefit.id, true)}
                >
                  추가
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="settings">
      <ScreenHeader
        title={`${app.name} 혜택 관리`}
        onBack={() => {
          window.location.href = '?settings=apps';
        }}
      />
      <section className="settings__section">
        <h2 className="settings__section-title">내 혜택</h2>
        {myBenefits.length === 0 ? (
          <p className="benefit-management__empty">사용 중인 혜택이 없습니다.</p>
        ) : (
          <ul className="benefit-management__list">
            {myBenefits.map((benefit) => (
              <li key={benefit.id} className="benefit-management__row">
                <span className="benefit-management__name">{benefit.name}</span>
                <button
                  type="button"
                  className="benefit-management__remove"
                  onClick={() => setBenefitEnabled(benefit.id, false)}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="benefit-management__add-entry"
          onClick={() => setMode('add')}
        >
          + 혜택 추가
        </button>
      </section>
    </div>
  );
}
