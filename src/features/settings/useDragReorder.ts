import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

interface DragState<T> {
  draggedId: T;
  offsetY: number;
}

interface DragInfo<T> {
  pointerId: number;
  draggedId: T;
  startClientY: number;
  startIndex: number;
  slotHeight: number;
  gestureStartOrder: T[];
}

/**
 * Pointer-events-only drag reorder for an order-mode preview list. Only
 * ever calls setPreviewOrder — never touches any persisted order/
 * localStorage, so a drag gesture alone can never persist anything.
 * Generic over the id type (T extends string) so both app ids
 * (AppManagement) and benefit ids (BenefitManagement) can reuse this same
 * implementation without duplicating the pointer-event logic.
 *
 * The dragged item's target slot is recomputed on every pointermove from
 * total displacement since gesture start (startIndex + deltaY/slotHeight),
 * not by incrementally swapping on each neighbor-midpoint crossing — this
 * avoids any drift accumulating across many small moves.
 */
export function useDragReorder<T extends string>(
  previewOrder: T[],
  setPreviewOrder: (next: T[]) => void,
) {
  const [dragState, setDragState] = useState<DragState<T> | null>(null);
  const rowRefs = useRef(new Map<T, HTMLLIElement>());
  const dragInfoRef = useRef<DragInfo<T> | null>(null);

  const registerRow = useCallback((id: T, el: HTMLLIElement | null) => {
    if (el) {
      rowRefs.current.set(id, el);
    } else {
      rowRefs.current.delete(id);
    }
  }, []);

  function measureSlotHeight(order: T[]): number {
    const firstEl = order[0] !== undefined ? rowRefs.current.get(order[0]) : undefined;
    const secondEl = order[1] !== undefined ? rowRefs.current.get(order[1]) : undefined;
    if (firstEl && secondEl) {
      return secondEl.getBoundingClientRect().top - firstEl.getBoundingClientRect().top;
    }
    return firstEl ? firstEl.getBoundingClientRect().height : 60;
  }

  function handlePointerDown(id: T, event: ReactPointerEvent<HTMLButtonElement>): void {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragInfoRef.current = {
      pointerId: event.pointerId,
      draggedId: id,
      startClientY: event.clientY,
      startIndex: previewOrder.indexOf(id),
      slotHeight: measureSlotHeight(previewOrder) || 60,
      gestureStartOrder: previewOrder,
    };
    setDragState({ draggedId: id, offsetY: 0 });
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
