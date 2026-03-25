/**
 * src/contexts/ThemeContext.tsx
 * Contexto global de tema (light | dark).
 * Tema padrão: light — respeita preferência salva no localStorage.
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeValue, ThemeContextValue } from '../types';

const STORAGE_KEY = 'ecoplus-theme';

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeValue>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    /* Respeita preferência salva; caso contrário usa light como padrão */
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setThemeState((t) => (t === 'light' ? 'dark' : 'light'));

  const setTheme = (t: ThemeValue) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}