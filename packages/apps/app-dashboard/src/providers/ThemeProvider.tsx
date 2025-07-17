import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

    const initialTheme = savedTheme || systemPreference;
    setTheme(initialTheme);
    updateCSSVariables(initialTheme);
  }, []);

  const updateCSSVariables = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement;

    if (newTheme === 'dark') {
      // Main background variables to match theme system
      root.style.setProperty('--background', '0 0% 0%'); // bg-black
      root.style.setProperty('--foreground', '0 0% 100%'); // text-white
      root.style.setProperty('--border', '0 0% 100% / 0.1'); // border-white/10

      // Button variables for SidebarTrigger
      root.style.setProperty('--muted', '0 0% 100% / 0.02'); // muted background
      root.style.setProperty('--muted-foreground', '0 0% 100% / 0.6'); // muted text
      root.style.setProperty('--accent', '0 0% 100% / 0.02'); // accent background
      root.style.setProperty('--accent-foreground', '0 0% 100%'); // accent text

      // Dark theme sidebar variables to match consent components
      root.style.setProperty('--sidebar', '220 13% 9%'); // bg-gray-900
      root.style.setProperty('--sidebar-foreground', '0 0% 100%'); // text-white
      root.style.setProperty('--sidebar-primary', '0 0% 100%'); // text-white
      root.style.setProperty('--sidebar-primary-foreground', '0 0% 0%'); // text-black
      root.style.setProperty('--sidebar-accent', '0 0% 100% / 0.02'); // bg-white/[0.02]
      root.style.setProperty('--sidebar-accent-foreground', '0 0% 100%'); // text-white
      root.style.setProperty('--sidebar-border', '0 0% 100% / 0.1'); // border-white/10
      root.style.setProperty('--sidebar-ring', '0 0% 100% / 0.2'); // border-white/20
    } else {
      // Main background variables to match theme system
      root.style.setProperty('--background', '210 20% 98%'); // bg-gray-50
      root.style.setProperty('--foreground', '222 84% 5%'); // text-gray-900
      root.style.setProperty('--border', '214 32% 91%'); // border-gray-200

      // Button variables for SidebarTrigger
      root.style.setProperty('--muted', '220 14% 96%'); // muted background
      root.style.setProperty('--muted-foreground', '215 16% 47%'); // muted text
      root.style.setProperty('--accent', '220 14% 96%'); // accent background
      root.style.setProperty('--accent-foreground', '222 84% 5%'); // accent text

      // Light theme sidebar variables to match consent components
      root.style.setProperty('--sidebar', '0 0% 100%'); // bg-white
      root.style.setProperty('--sidebar-foreground', '222 84% 5%'); // text-gray-900
      root.style.setProperty('--sidebar-primary', '222 84% 5%'); // text-gray-900
      root.style.setProperty('--sidebar-primary-foreground', '0 0% 100%'); // text-white
      root.style.setProperty('--sidebar-accent', '220 14% 96%'); // bg-gray-100/50
      root.style.setProperty('--sidebar-accent-foreground', '222 84% 5%'); // text-gray-900
      root.style.setProperty('--sidebar-border', '214 32% 91%'); // border-gray-200
      root.style.setProperty('--sidebar-ring', '213 27% 84%'); // border-gray-300
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    updateCSSVariables(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        isDark: theme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
