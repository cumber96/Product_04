import { useMemo, useState } from 'react';
import { BENEFITS, BENEFIT_APPS } from '../../domain/benefits/catalog';
import type { BenefitAppId } from '../../domain/benefits/types';
import { getAddableBenefitsForApp } from '../../domain/benefits/myBenefits';
import { getOrderedBenefitIdsForApp, moveBenefitOrder } from '../../domain/benefits/benefitOrder';
import { Modal } from '../../components/Modal';
import { useMyBenefits } from './useMyBenefits';
import { useBenefitOrder } from './useBenefitOrder';
import { useOrderEditor } from './useOrderEditor';
import { useDragReorder } from './useDragReorder';
import { ScreenHeader } from './ScreenHeader';
import './Settings.css';
import './BenefitManagement.css';
import './AppManagement.css';

type Mode = 'list' | 'add' | 'order';

export function BenefitManagement({ appId }: { appId: BenefitAppId }) {
  const app = BENEFIT_APPS.find((candidate) => candidate.id === appId)!;
  const { myBenefitIds, setBenefitEnabled } = useMyBenefits();
  const { benefitOrder, setBenefitOrder } = useBenefitOrder(appId);
  const [mode, setMode] = useState<Mode>('list');

  const orderedBenefitIds = useMemo(
    () => getOrderedBenefitIdsForApp(BENEFITS, appId, benefitOrder),
    [appId, benefitOrder],
  );
  const myBenefits = useMemo(
    () =>
      orderedBenefitIds
        .filter((id) => myBenefitIds.has(id))
        .map((id) => BENEFITS.find((benefit) => benefit.id === id)!),
    [orderedBenefitIds, myBenefitIds],
  );
  const addableBenefits = useMemo(
    () => getAddableBenefitsForApp(BENEFITS, appId, myBenefitIds),
    [appId, myBenefitIds],
  );

  const { previewOrder, setPreviewOrder, dirty, pendingAction, save, resolvePending, runOrGuard } =
    useOrderEditor(benefitOrder, setBenefitOrder);

  const {
    dragState,
    registerRow,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  } = useDragReorder(previewOrder, setPreviewOrder);

  const previewBenefits = previewOrder.map(
    (id) => BENEFITS.find((benefit) => benefit.id === id)!,
  );

  function handleBack(): void {
    runOrGuard(() => {
      window.location.href = '?settings=apps';
    });
  }

  function handleSwitchToList(): void {
    runOrGuard(() => setMode('list'));
  }

  function handleArrowMove(benefitId: string, direction: 'up' | 'down'): void {
    setPreviewOrder(moveBenefitOrder(previewOrder, benefitId, direction));
  }

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
      <ScreenHeader title={`${app.name} 혜택 관리`} onBack={handleBack} />

      <div className="app-management__segmented" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'list'}
          className={
            mode === 'list'
              ? 'app-management__segment app-management__segment--active'
              : 'app-management__segment'
          }
          onClick={handleSwitchToList}
        >
          내 혜택
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

      {mode === 'list' ? (
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
      ) : (
        <section className="settings__section">
          <ul className="app-management__list app-management__order-list">
            {previewBenefits.map((benefit) => {
              const dragOffset =
                dragState && dragState.draggedId === benefit.id ? dragState.offsetY : null;
              return (
                <li
                  key={benefit.id}
                  ref={(el) => registerRow(benefit.id, el)}
                  className={
                    dragOffset !== null
                      ? 'app-management__row app-management__row--dragging'
                      : 'app-management__row'
                  }
                  style={
                    dragOffset !== null ? { transform: `translateY(${dragOffset}px)` } : undefined
                  }
                >
                  <span className="app-management__row-name app-management__row-name--static">
                    {benefit.name}
                  </span>
                  <button
                    type="button"
                    className="app-management__drag-handle"
                    aria-label={`${benefit.name} 순서 변경. 화살표 위/아래 키로도 이동할 수 있습니다.`}
                    onPointerDown={(event) => handlePointerDown(benefit.id, event)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        handleArrowMove(benefit.id, 'up');
                      } else if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        handleArrowMove(benefit.id, 'down');
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
              <button type="button" className="app-management__save-button" onClick={save}>
                저장하기
              </button>
            </div>
          )}
        </section>
      )}

      {pendingAction && (
        <Modal>
          <div className="modal__content">
            <p className="modal__title">바꾼 내용을 저장할까요?</p>
            <div className="modal__actions">
              <button type="button" className="modal__button" onClick={() => resolvePending(false)}>
                아니요
              </button>
              <button
                type="button"
                className="modal__button modal__button--primary"
                onClick={() => resolvePending(true)}
              >
                저장하기
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
