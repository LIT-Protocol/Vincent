import { useState, useEffect } from 'react';
import { env } from '@/config/env';

export type ZerionChartsData = {
  data: {
    type: string;
    id: string;
    attributes: {
      begin_at: string;
      end_at: string;
      stats: {
        total_value: number;
        total_value_24h_ago: number;
        absolute_change_24h: number;
        percent_change_24h: number;
      };
      points: Array<{
        timestamp: number;
        value: number;
      }>;
    };
  };
};

export type UseZerionChartsProps = {
  address: string;
  period?: 'day' | 'week' | 'month' | 'year' | 'max';
};

export type UseZerionChartsReturn = {
  data: ZerionChartsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

const ZERION_API_KEY = env.VITE_ZERION_API_KEY;

export const useZerionCharts = ({ 
  address, 
  period = 'day' 
}: UseZerionChartsProps): UseZerionChartsReturn => {
  const [state, setState] = useState<{
    data: ZerionChartsData | null;
    isLoading: boolean;
    error: string | null;
  }>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchCharts = async () => {
    if (!address) {
      setState({
        data: null,
        isLoading: false,
        error: 'No address provided',
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          authorization: `Basic ${btoa(ZERION_API_KEY + ':')}`
        }
      };

      const response = await fetch(
        `https://api.zerion.io/v1/wallets/${address}/charts/${period}?currency=usd`,
        options
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setState({
        data,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch charts data',
      });
    }
  };

  useEffect(() => {
    fetchCharts();
  }, [address, period]);

  return {
    ...state,
    refetch: fetchCharts,
  };
};