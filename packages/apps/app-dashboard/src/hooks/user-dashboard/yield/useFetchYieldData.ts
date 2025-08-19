import { useState, useEffect } from 'react';

interface YieldStrategyData {
  data: {
    state: {
      netApy: number;
    };
  };
  success: boolean;
}

interface UseFetchYieldDataReturn {
  yieldData: YieldStrategyData | null;
  isLoading: boolean;
  error: string | null;
}

export function useFetchYieldData(shouldFetch = true): UseFetchYieldDataReturn {
  const [yieldData, setYieldData] = useState<YieldStrategyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldFetch) return;

    setIsLoading(true);
    setError(null);

    fetch('/api/yield/strategy/top', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data: YieldStrategyData) => {
        setYieldData(data);
      })
      .catch((error) => {
        console.error('Failed to fetch yield data:', error);
        setError(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [shouldFetch]);

  return {
    yieldData,
    isLoading,
    error,
  };
}
