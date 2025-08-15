import { useState, useEffect } from 'react';

export function useCanGoBack(): boolean {
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Check once if there's history to go back to
    // window.history.length > 1 means there are previous entries
    setCanGoBack(window.history.length > 1);
  }, []);

  return canGoBack;
}
 