import { useState, useEffect } from 'react';
import { env } from '@/config/env';

export type ZerionPosition = {
  type: string;
  id: string;
  attributes: {
    parent: {
      type: string;
      id: string;
    };
    fungible_info: {
      name: string;
      symbol: string;
      icon?: {
        url: string;
      };
    };
    quantity: {
      int: string;
      decimals: number;
      numeric: string;
    };
    value?: number;
    price?: number;
    changes?: {
      absolute_1d?: number;
      percent_1d?: number;
    };
  };
};

export type ZerionPositionsData = {
  data: ZerionPosition[];
  links?: {
    next?: string;
  };
};

export type UseZerionPositionsProps = {
  address: string;
};

export type UseZerionPositionsReturn = {
  data: ZerionPositionsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

const ZERION_API_KEY = env.VITE_ZERION_API_KEY;

export const useZerionPositions = ({ address }: UseZerionPositionsProps): UseZerionPositionsReturn => {
  const [state, setState] = useState<{
    data: ZerionPositionsData | null;
    isLoading: boolean;
    error: string | null;
  }>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchPositions = async () => {
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
        `https://api.zerion.io/v1/wallets/${address}/positions/?filter[positions]=only_simple&currency=usd`,
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
        error: error instanceof Error ? error.message : 'Failed to fetch positions data',
      });
    }
  };

  useEffect(() => {
    fetchPositions();
  }, [address]);

  return {
    ...state,
    refetch: fetchPositions,
  };
};