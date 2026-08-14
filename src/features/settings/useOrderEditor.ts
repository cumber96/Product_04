import { useState } from 'react';

function sameOrder<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

/**
 * Generic preview/dirty/save/discard/leave-guard state machine for a
 * drag-reorderable list that should only persist on an explicit "저장하기"
 * action — same shape as the pattern proven in AppManagement.tsx (kept
 * inline there rather than migrated to this hook, to avoid touching
 * already-verified behavior). Used by BenefitManagement.tsx's order mode.
 */
export function useOrderEditor<T>(savedOrder: T[], commit: (next: T[]) => void) {
  const [previewOrder, setPreviewOrder] = useState<T[]>(savedOrder);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const dirty = !sameOrder(previewOrder, savedOrder);

  function save(): void {
    commit(previewOrder);
  }

  function discard(): void {
    setPreviewOrder(savedOrder);
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
      save();
    } else {
      discard();
    }
    const action = pendingAction;
    setPendingAction(null);
    action?.();
  }

  return {
    previewOrder,
    setPreviewOrder,
    dirty,
    pendingAction,
    save,
    discard,
    runOrGuard,
    resolvePending,
  };
}
