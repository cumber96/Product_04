import { HomePage } from './pages/HomePage';
import { StepsPocPage } from './pages/StepsPocPage';

function App() {
  const path = window.location.pathname;

  if (path === '/steps-poc' || path === '/steps-poc/') {
    return <StepsPocPage />;
  }

  return <HomePage />;
}

export default App;
