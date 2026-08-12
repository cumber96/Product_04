import { Confirmation } from './Confirmation';
import './Confirmation.css';

/**
 * Bottom sheet chrome (backdrop + panel + close button) around the existing
 * Confirmation UI/logic. Closing (backdrop tap or X) never completes any
 * benefit — it just hides the sheet; candidates stay pending.
 */
export function ConfirmationSheet({
  onClose,
  onConfirmed,
}: {
  onClose: () => void;
  onConfirmed: (completedBenefitIds: Set<string>) => void;
}) {
  return (
    <div className="confirmation-sheet__backdrop" onClick={onClose}>
      <div className="confirmation-sheet__panel" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="confirmation-sheet__close"
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>
        <Confirmation onConfirmed={onConfirmed} />
      </div>
    </div>
  );
}
