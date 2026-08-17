import { Modal } from '../../components/Modal';
import type { BenefitAppId } from '../../domain/benefits/types';
import { Confirmation } from './Confirmation';
import './Confirmation.css';

/**
 * Compact-dialog chrome (shared Modal shell) around the existing
 * Confirmation UI/logic, scoped to one app's pending confirmation. Closing
 * (backdrop tap or X, the latter rendered by Confirmation itself so it can
 * sit in the same header row as the title) never completes any benefit and
 * never clears the pending — it just hides the sheet; dismiss ≠ complete.
 */
export function ConfirmationSheet({
  appId,
  onClose,
  onConfirmed,
}: {
  appId: BenefitAppId;
  onClose: () => void;
  onConfirmed: (completedBenefitIds: Set<string>) => void;
}) {
  return (
    <Modal onDismiss={onClose}>
      <Confirmation appId={appId} onConfirmed={onConfirmed} onClose={onClose} />
    </Modal>
  );
}
