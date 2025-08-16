import { useState, useEffect } from 'react';
import { env } from '@/config/env';

export type ZerionPortfolioData = {
  data: {
    type: string;
    id: string;
    attributes: {
      positions_distribution_by_type: Record<string, any>;
      positions_distribution_by_chain: Record<string, any>;
      total: {
        positions: number;
        value: number;
      };
      changes: {
        absolute_1d: number;
        percent_1d: number;
      };
    };
  };
  included?: any[];
};

export type UseZerionPortfolioProps = {
  address: string;
};

export type UseZerionPortfolioReturn = {
  data: ZerionPortfolioData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

const ZERION_API_KEY = env.VITE_ZERION_API_KEY;

export const useZerionPortfolio = ({ address }: UseZerionPortfolioProps): UseZerionPortfolioReturn => {
  const [state, setState] = useState<{
    data: ZerionPortfolioData | null;
    isLoading: boolean;
    error: string | null;
  }>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchPortfolio = async () => {
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
        `https://api.zerion.io/v1/wallets/${address}/portfolio?filter[positions]=only_simple&currency=usd`,
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
        error: error instanceof Error ? error.message : 'Failed to fetch portfolio data',
      });
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [address]);

  return {
    ...state,
    refetch: fetchPortfolio,
  };
};