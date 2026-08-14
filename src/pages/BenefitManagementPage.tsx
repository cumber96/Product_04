import { BENEFIT_APPS } from '../domain/benefits/catalog';
import type { BenefitAppId } from '../domain/benefits/types';
import { BenefitManagement } from '../features/settings/BenefitManagement';
import '../features/settings/Settings.css';

function isBenefitAppId(value: string | null): value is BenefitAppId {
  return BENEFIT_APPS.some((app) => app.id === value);
}

export function BenefitManagementPage() {
  const params = new URLSearchParams(window.location.search);
  const appId = params.get('app');

  return (
    <main className="app">
      {isBenefitAppId(appId) ? (
        <BenefitManagement appId={appId} />
      ) : (
        <div className="settings">
          <button
            type="button"
            className="settings__back"
            onClick={() => {
              window.location.href = '?settings';
            }}
          >
            <span aria-hidden="true">‹</span> 설정으로
          </button>
        </div>
      )}
    </main>
  );
}
