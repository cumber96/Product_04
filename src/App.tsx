import { HomePage } from './pages/HomePage';
import { StepsPocPage } from './pages/StepsPocPage';
import { ConfirmationPage } from './pages/ConfirmationPage';

function App() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('poc') === 'steps') {
    return <StepsPocPage />;
  }

  if (params.has('confirm')) {
    return <ConfirmationPage />;
  }

  return <HomePage />;
}

export default App;
