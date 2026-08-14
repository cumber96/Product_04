import type { MouseEvent, ReactNode } from 'react';
import './Modal.css';

/**
 * Shared compact-dialog shell: dimmed backdrop, centered panel capped to a
 * narrow width so it never spans the full screen (never a bottom sheet).
 * Tapping the backdrop only dismisses when onDismiss is provided —
 * confirm-style dialogs that require an explicit button choice should omit
 * it so an accidental backdrop tap can't silently discard anything.
 */
export function Modal({
  onDismiss,
  children,
}: {
  onDismiss?: () => void;
  children: ReactNode;
}) {
  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onDismiss?.();
    }
  }

  return (
    <div className="modal__backdrop" onClick={onDismiss ? handleBackdropClick : undefined}>
      <div className="modal__panel">{children}</div>
    </div>
  );
}
