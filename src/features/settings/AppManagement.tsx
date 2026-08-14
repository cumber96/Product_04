import { useState } from 'react';
import { BENEFIT_APPS } from '../../domain/benefits/catalog';
import { getOrderedApps, moveAppOrder } from '../../domain/benefits/appOrder';
import type { BenefitAppId } from '../../domain/benefits/types';
import { useEnabledApps } from './useEnabledApps';
import { useAppOrder } from './useAppOrder';
import { useDragReorder } from './useDragReorder';
import { ScreenHeader } from './ScreenHeader';
import './Settings.css';
import './AppManagement.css';

type Mode = 'hide' | 'order';

function sameOrder(a: BenefitAppId[], b: BenefitAppId[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

export function AppManagement() {
  const { enabledAppIds, setAppEnabled } = useEnabledApps();
  const { appOrder, setAppOrder } = useAppOrder();
  const [mode, setMode] = useState<Mode>('hide');
  const [previewOrder, setPreviewOrder] = useState<BenefitAppId[]>(appOrder);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const dirty = !sameOrder(previewOrder, appOrder);

  const orderedApps = getOrderedApps(BENEFIT_APPS, appOrder);
  const visibleApps = orderedApps.filter((app) => enabledAppIds.has(app.id));
  const hiddenApps = orderedApps.filter((app) => !enabledAppIds.has(app.id));

  const previewApps = previewOrder.map(
    (id) => BENEFIT_APPS.find((app) => app.id === id)!,
  );

  const {
    dragState,
    registerRow,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  } = useDragReorder(previewOrder, setPreviewOrder);

  function saveOrder(): void {
    setAppOrder(previewOrder);
  }

  function discardOrder(): void {
    setPreviewOrder(appOrder);
  }

  function runOrGuard(action: () => void): void {
    if (dirty) {
      setPendingAction(() => action);
    } else {
      action();
    }
  }

  function resolvePending(shouldSave: boolean): void {
    if (shouldSave) {
      saveOrder();
    } else {
      discardOrder();
    }
    const action = pendingAction;
    setPendingAction(null);
    action?.();
  }

  function handleBack(): void {
    runOrGuard(() => {
      window.location.href = '/';
    });
  }

  function handleSwitchToHide(): void {
    runOrGuard(() => setMode('hide'));
  }

  function handleArrowMove(appId: BenefitAppId, direction: 'up' | 'down'): void {
    setPreviewOrder(moveAppOrder(previewOrder, appId, direction));
  }

  return (
    <div className="settings">
      <ScreenHeader title="앱 관리" onBack={handleBack} />

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
          onClick={handleSwitchToHide}
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
          <ul className="app-management__list app-management__order-list">
            {previewApps.map((app) => {
              const dragOffset =
                dragState && dragState.draggedId === app.id ? dragState.offsetY : null;
              return (
                <li
                  key={app.id}
                  ref={(el) => registerRow(app.id, el)}
                  className={
                    dragOffset !== null
                      ? 'app-management__row app-management__row--dragging'
                      : 'app-management__row'
                  }
                  style={dragOffset !== null ? { transform: `translateY(${dragOffset}px)` } : undefined}
                >
                  <span className="app-management__row-name app-management__row-name--static">
                    {app.name}
                  </span>
                  <button
                    type="button"
                    className="app-management__drag-handle"
                    aria-label={`${app.name} 순서 변경. 화살표 위/아래 키로도 이동할 수 있습니다.`}
                    onPointerDown={(event) => handlePointerDown(app.id, event)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        handleArrowMove(app.id, 'up');
                      } else if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        handleArrowMove(app.id, 'down');
                      }
                    }}
                  >
                    ≡
                  </button>
                </li>
              );
            })}
          </ul>

          {dirty && (
            <div className="app-management__save-bar">
              <button type="button" className="app-management__save-button" onClick={saveOrder}>
                저장하기
              </button>
            </div>
          )}
        </section>
      )}

      {pendingAction && (
        <div className="app-management__modal-backdrop">
          <div className="app-management__modal">
            <p className="app-management__modal-title">바꾼 내용을 저장할까요?</p>
            <div className="app-management__modal-actions">
              <button
                type="button"
                className="app-management__modal-button"
                onClick={() => resolvePending(false)}
              >
                아니요
              </button>
              <button
                type="button"
                className="app-management__modal-button app-management__modal-button--primary"
                onClick={() => resolvePending(true)}
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
