import './ScreenHeader.css';

/**
 * Shared header for settings-family screens: icon-only back button on the
 * left, title centered independent of the back button's width (a reserved
 * empty column on the right balances it), no back-destination text.
 */
export function ScreenHeader({ title, onBack }: { title?: string; onBack: () => void }) {
  return (
    <header className="screen-header">
      <button type="button" className="screen-header__back" onClick={onBack} aria-label="뒤로">
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      {title && <h1 className="screen-header__title">{title}</h1>}
    </header>
  );
}
