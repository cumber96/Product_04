import { useMemo, useState } from 'react';
import { BENEFIT_APPS } from '../../domain/benefits/catalog';
import { getOrderedApps } from '../../domain/benefits/appOrder';
import { useEnabledApps } from './useEnabledApps';
import { useAppOrder } from './useAppOrder';
import { ScreenHeader } from './ScreenHeader';
import './Settings.css';
import './AppManagement.css';

type Mode = 'hide' | 'order';

export function AppManagement() {
  const { enabledAppIds, setAppEnabled } = useEnabledApps();
  const { appOrder, moveApp } = useAppOrder();
  const [mode, setMode] = useState<Mode>('hide');

  const orderedApps = useMemo(() => getOrderedApps(BENEFIT_APPS, appOrder), [appOrder]);
  const visibleApps = orderedApps.filter((app) => enabledAppIds.has(app.id));
  const hiddenApps = orderedApps.filter((app) => !enabledAppIds.has(app.id));

  return (
    <div className="settings">
      <ScreenHeader
        title="앱 관리"
        onBack={() => {
          window.location.href = '/';
        }}
      />

      <div className="app-management__segmented" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'hide'}
          className={
            mode === 'hide'
              ? 'app-management__segment app-management__segment--active'
              : 'app-management__segment'
          }
          onClick={() => setMode('hide')}
        >
          앱 숨기기
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'order'}
          className={
            mode === 'order'
              ? 'app-management__segment app-management__segment--active'
              : 'app-management__segment'
          }
          onClick={() => setMode('order')}
        >
          순서 바꾸기
        </button>
      </div>

      {mode === 'hide' ? (
        <>
          <section className="settings__section">
            <h2 className="settings__section-title">사용 중</h2>
            {visibleApps.length === 0 ? (
              <p className="app-management__empty">사용 중인 앱이 없습니다.</p>
            ) : (
              <ul className="app-management__list">
                {visibleApps.map((app) => (
                  <li key={app.id} className="app-management__row">
                    <button
                      type="button"
                      className="app-management__row-name"
                      onClick={() => {
                        window.location.href = `?settings=benefits&app=${app.id}`;
                      }}
                    >
                      {app.name}
                    </button>
                    <button
                      type="button"
                      className="app-management__action"
                      onClick={() => setAppEnabled(app.id, false)}
                    >
                      숨기기
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {hiddenApps.length > 0 && (
            <section className="settings__section">
              <h2 className="settings__section-title">숨긴 앱</h2>
              <ul className="app-management__list">
                {hiddenApps.map((app) => (
                  <li key={app.id} className="app-management__row">
                    <span className="app-management__row-name app-management__row-name--static">
                      {app.name}
                    </span>
                    <button
                      type="button"
                      className="app-management__action app-management__action--add"
                      onClick={() => setAppEnabled(app.id, true)}
                    >
                      추가
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <section className="settings__section">
          <ul className="app-management__list">
            {orderedApps.map((app, index) => (
              <li key={app.id} className="app-management__row">
                <span className="app-management__row-name app-management__row-name--static">
                  {app.name}
                </span>
                <div className="app-management__order-controls">
                  <button
                    type="button"
                    className="app-management__order-button"
                    disabled={index === 0}
                    aria-label={`${app.name} 위로 이동`}
                    onClick={() => moveApp(app.id, 'up')}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="app-management__order-button"
                    disabled={index === orderedApps.length - 1}
                    aria-label={`${app.name} 아래로 이동`}
                    onClick={() => moveApp(app.id, 'down')}
                  >
                    ▼
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
