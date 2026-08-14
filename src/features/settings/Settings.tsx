import { BENEFITS, BENEFIT_APPS } from '../../domain/benefits/catalog';
import { getMyBenefitsForApp } from '../../domain/benefits/myBenefits';
import { useEnabledApps } from './useEnabledApps';
import { useMyBenefits } from './useMyBenefits';
import './Settings.css';

export function Settings() {
  const { enabledAppIds, setAppEnabled } = useEnabledApps();
  const { myBenefitIds } = useMyBenefits();

  return (
    <div className="settings">
      <header className="settings__header">
        <button
          type="button"
          className="settings__back"
          onClick={() => {
            window.location.href = '/';
          }}
        >
          <span aria-hidden="true">‹</span> 홈으로
        </button>
        <h1 className="settings__title">설정</h1>
      </header>
      <section className="settings__section">
        <h2 className="settings__section-title">사용 중인 앱 관리</h2>
        <ul className="settings__app-list">
          {BENEFIT_APPS.map((app) => {
            const myBenefitCount = getMyBenefitsForApp(BENEFITS, app.id, myBenefitIds).length;
            return (
              <li key={app.id} className="settings__app-row">
                <div className="settings__app-row-top">
                  <span className="settings__app-name">{app.name}</span>
                  <label className="settings__toggle">
                    <input
                      type="checkbox"
                      checked={enabledAppIds.has(app.id)}
                      onChange={(event) => setAppEnabled(app.id, event.target.checked)}
                      aria-label={`${app.name} 사용`}
                    />
                    <span className="settings__toggle-track" aria-hidden="true" />
                  </label>
                </div>
                <button
                  type="button"
                  className="settings__benefit-entry"
                  onClick={() => {
                    window.location.href = `?settings=benefits&app=${app.id}`;
                  }}
                >
                  <span>혜택 {myBenefitCount}개 사용 중</span>
                  <span aria-hidden="true">›</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
