import { HomePage } from './pages/HomePage';
import { StepsPocPage } from './pages/StepsPocPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { BenefitManagementPage } from './pages/BenefitManagementPage';
import { AppManagementPage } from './pages/AppManagementPage';
import { AddBenefitPage } from './pages/AddBenefitPage';

function App() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('poc') === 'steps') {
    return <StepsPocPage />;
  }

  if (params.has('confirm')) {
    return <ConfirmationPage />;
  }

  if (params.has('add-benefit')) {
    return <AddBenefitPage />;
  }

  if (params.get('settings') === 'benefits') {
    return <BenefitManagementPage />;
  }

  if (params.get('settings') === 'apps') {
    return <AppManagementPage />;
  }

  return <HomePage />;
}

export default App;
