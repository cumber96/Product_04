import { useConfirmation } from './useConfirmation';
import './Confirmation.css';

export function Confirmation() {
  const { groups, selectedBenefitIds, toggleBenefit, confirm } = useConfirmation();

  function handleConfirm() {
    confirm();
    window.location.href = '/';
  }

  return (
    <div className="confirmation">
      <h1 className="confirmation__title">오늘 받은 혜택을 확인해주세요</h1>
      {groups.length === 0 ? (
        <p className="confirmation__empty">확인할 혜택이 없습니다.</p>
      ) : (
        groups.map((group) => (
          <section key={group.app.id} className="confirmation__group">
            <h2 className="confirmation__group-title">{group.app.name}</h2>
            <ul className="confirmation__list">
              {group.benefits.map((benefit) => (
                <li key={benefit.id} className="confirmation__item">
                  <label className="confirmation__item-label">
                    <input
                      type="checkbox"
                      checked={selectedBenefitIds.has(benefit.id)}
                      onChange={() => toggleBenefit(benefit.id)}
                    />
                    {benefit.name}
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
      <button type="button" className="confirmation__submit" onClick={handleConfirm}>
        확인 완료
      </button>
    </div>
  );
}
