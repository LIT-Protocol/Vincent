// Simple event emitter for theme changes
type ThemeChangeListener = (isDark: boolean) => void;
const listeners = new Set<ThemeChangeListener>();

export const subscribeToThemeChanges = (listener: ThemeChangeListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyThemeChange = (isDark: boolean) => {
  listeners.forEach((listener) => listener(isDark));
};

// Native Tailwind theme utilities - no React state needed
export const toggleTheme = () => {
  const html = document.documentElement;
  const isDark = html.classList.contains('dark');

  if (isDark) {
    html.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    notifyThemeChange(false);
  } else {
    html.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    notifyThemeChange(true);
  }
};

export const initializeTheme = () => {
  const html = document.documentElement;

  // Check for saved theme preference or default to system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

  const initialTheme = savedTheme || systemPreference;

  if (initialTheme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
};

export const isDarkMode = () => {
  return document.documentElement.classList.contains('dark');
};
