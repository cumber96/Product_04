import { Modal } from '../../components/Modal';
import { Confirmation } from './Confirmation';
import './Confirmation.css';

/**
 * Compact-dialog chrome (shared Modal shell) around the existing
 * Confirmation UI/logic. Closing (backdrop tap or X, the latter rendered
 * by Confirmation itself so it can sit in the same header row as the
 * title) never completes any benefit — it just hides the sheet; candidates
 * stay pending.
 */
export function ConfirmationSheet({
  onClose,
  onConfirmed,
}: {
  onClose: () => void;
  onConfirmed: (completedBenefitIds: Set<string>) => void;
}) {
  return (
    <Modal onDismiss={onClose}>
      <Confirmation onConfirmed={onConfirmed} onClose={onClose} />
    </Modal>
  );
}
