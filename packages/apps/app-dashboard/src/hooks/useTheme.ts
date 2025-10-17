import { useState, useEffect } from 'react';
import { isDarkMode, subscribeToThemeChanges } from '@/lib/theme';

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return isDarkMode();
    }
    return false;
  });

  useEffect(() => {
    // Subscribe to theme changes
    const unsubscribe = subscribeToThemeChanges((newIsDark) => {
      setIsDark(newIsDark);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  return isDark;
}
