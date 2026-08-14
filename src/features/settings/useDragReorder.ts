import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { BenefitAppId } from '../../domain/benefits/types';

interface DragState {
  draggedId: BenefitAppId;
  offsetY: number;
}

interface DragInfo {
  pointerId: number;
  draggedId: BenefitAppId;
  startClientY: number;
  startIndex: number;
  slotHeight: number;
  gestureStartOrder: BenefitAppId[];
}

/**
 * Pointer-events-only drag reorder for the order-mode preview list. Only
 * ever calls setPreviewOrder — never touches useAppOrder/localStorage, so a
 * drag gesture alone can never persist anything.
 *
 * The dragged item's target slot is recomputed on every pointermove from
 * total displacement since gesture start (startIndex + deltaY/slotHeight),
 * not by incrementally swapping on each neighbor-midpoint crossing — this
 * avoids any drift accumulating across many small moves.
 */
export function useDragReorder(
  previewOrder: BenefitAppId[],
  setPreviewOrder: (next: BenefitAppId[]) => void,
) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const rowRefs = useRef(new Map<BenefitAppId, HTMLLIElement>());
  const dragInfoRef = useRef<DragInfo | null>(null);

  const registerRow = useCallback((appId: BenefitAppId, el: HTMLLIElement | null) => {
    if (el) {
      rowRefs.current.set(appId, el);
    } else {
      rowRefs.current.delete(appId);
    }
  }, []);

  function measureSlotHeight(order: BenefitAppId[]): number {
    const firstEl = order[0] ? rowRefs.current.get(order[0]) : undefined;
    const secondEl = order[1] ? rowRefs.current.get(order[1]) : undefined;
    if (firstEl && secondEl) {
      return secondEl.getBoundingClientRect().top - firstEl.getBoundingClientRect().top;
    }
    return firstEl ? firstEl.getBoundingClientRect().height : 60;
  }

  function handlePointerDown(
    appId: BenefitAppId,
    event: ReactPointerEvent<HTMLButtonElement>,
  ): void {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragInfoRef.current = {
      pointerId: event.pointerId,
      draggedId: appId,
      startClientY: event.clientY,
      startIndex: previewOrder.indexOf(appId),
      slotHeight: measureSlotHeight(previewOrder) || 60,
      gestureStartOrder: previewOrder,
    };
    setDragState({ draggedId: appId, offsetY: 0 });
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>): void {
    const info = dragInfoRef.current;
    if (!info || event.pointerId !== info.pointerId) return;

    const deltaY = event.clientY - info.startClientY;
    const rawSlotOffset = deltaY / info.slotHeight;
    const currentIndex = previewOrder.indexOf(info.draggedId);
    const targetIndex = Math.min(
      previewOrder.length - 1,
      Math.max(0, Math.round(info.startIndex + rawSlotOffset)),
    );

    if (targetIndex !== currentIndex && currentIndex !== -1) {
      const next = [...previewOrder];
      next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, info.draggedId);
      setPreviewOrder(next);
    }

    const appliedSlots = targetIndex - info.startIndex;
    setDragState({ draggedId: info.draggedId, offsetY: deltaY - appliedSlots * info.slotHeight });
  }

  function endDrag(event: ReactPointerEvent<HTMLButtonElement>): void {
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
    dragInfoRef.current = null;
    setDragState(null);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLButtonElement>): void {
    const info = dragInfoRef.current;
    if (!info || event.pointerId !== info.pointerId) return;
    // previewOrder already reflects every move made during this gesture —
    // pointerup deliberately does not save or revert anything.
    endDrag(event);
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLButtonElement>): void {
    const info = dragInfoRef.current;
    if (!info || event.pointerId !== info.pointerId) return;
    // Roll back only this gesture's in-progress moves — any earlier,
    // already-completed (but still unsaved) drags in this session stay.
    setPreviewOrder(info.gestureStartOrder);
    endDrag(event);
  }

  return {
    dragState,
    registerRow,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  };
}
