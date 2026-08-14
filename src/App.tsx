import { HomePage } from './pages/HomePage';
import { StepsPocPage } from './pages/StepsPocPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { SettingsPage } from './pages/SettingsPage';
import { BenefitManagementPage } from './pages/BenefitManagementPage';

function App() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('poc') === 'steps') {
    return <StepsPocPage />;
  }

  if (params.has('confirm')) {
    return <ConfirmationPage />;
  }

  if (params.get('settings') === 'benefits') {
    return <BenefitManagementPage />;
  }

  if (params.has('settings')) {
    return <SettingsPage />;
  }

  return <HomePage />;
}

export default App;
