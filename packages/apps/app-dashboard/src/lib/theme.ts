// Native Tailwind theme utilities - no React state needed
export const toggleTheme = () => {
  const html = document.documentElement;
  const isDark = html.classList.contains('dark');

  if (isDark) {
    html.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    html.classList.add('dark');
    localStorage.setItem('theme', 'dark');
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
