import { useEffect } from 'react';
import { useThemeStore } from './store';
import { AppRouter } from './routes';

function App() {
  const { theme } = useThemeStore();

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app-container">
      <AppRouter />
    </div>
  );
}

export default App;
