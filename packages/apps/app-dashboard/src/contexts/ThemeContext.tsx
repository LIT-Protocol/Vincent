import { createContext, useContext, useState, ReactNode } from 'react';
import { explorerTheme } from '@/utils/explorer/theme';

interface ThemeContextType {
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
  theme: ReturnType<typeof explorerTheme>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const theme = explorerTheme(isDark);

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark, theme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
