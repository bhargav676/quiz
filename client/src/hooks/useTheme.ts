import { useThemeStore } from '../store';

export function useTheme() {
  const { theme, toggleTheme, setTheme } = useThemeStore();

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  };
}
