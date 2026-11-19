/**
 * ThemeContext — Modo Oscuro / Claro
 * Persiste la preferencia en localStorage y aplica data-theme="dark" en <html>.
 * Respeta prefers-color-scheme del SO al primer uso.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
});

const STORAGE_KEY = 'st-theme';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'dark' || stored === 'light') return stored;
    // Respetar preferencia del SO si no hay preferencia guardada
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {
    // SSR guard / entornos sin localStorage
  }
  return 'light';
}

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const initial = getInitialTheme();
    // Aplicar inmediatamente para evitar flash
    applyTheme(initial);
    return initial;
  });

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignorar
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
