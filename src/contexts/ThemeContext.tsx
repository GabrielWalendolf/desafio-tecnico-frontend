/**
 * src/contexts/ThemeContext.js
 * Contexto global de tema (light | dark).
 * Persiste em localStorage e aplica data-theme no <html>.
 */
import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'ecoplus-theme';

export const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  /* Aplica o atributo no <html> e persiste */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setThemeState((t) => (t === 'light' ? 'dark' : 'light'));

  const setTheme = (t) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}