import { HomePage } from './pages/HomePage';
import { StepsPocPage } from './pages/StepsPocPage';

function App() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('poc') === 'steps') {
    return <StepsPocPage />;
  }

  return <HomePage />;
}

export default App;
