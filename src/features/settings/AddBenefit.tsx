import { ScreenHeader } from './ScreenHeader';
import './Settings.css';

/**
 * Placeholder shell for the future "탐색 → 원하는 혜택 추가" flow — this
 * step only wires up navigation (header + back), no benefit browsing/add
 * logic yet.
 */
export function AddBenefit() {
  return (
    <div className="settings">
      <ScreenHeader
        title="혜택 추가하기"
        onBack={() => {
          window.location.href = '/';
        }}
      />
    </div>
  );
}
