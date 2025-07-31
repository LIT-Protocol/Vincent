import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// USDC contract address on Base network
const USDC_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// Base network RPC URL
const BASE_RPC_URL = 'https://mainnet.base.org';

// Standard ERC20 ABI for balanceOf function
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

export type UseUSDCBalanceProps = {
  address: string;
};

export type UseUSDCBalanceReturn = {
  balance: string | null;
  balanceFormatted: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export const useUSDCBalance = ({ address }: UseUSDCBalanceProps): UseUSDCBalanceReturn => {
  const [state, setState] = useState<{
    balance: string | null;
    balanceFormatted: string | null;
    isLoading: boolean;
    error: string | null;
  }>({
    balance: null,
    balanceFormatted: null,
    isLoading: true,
    error: null,
  });

  const fetchBalance = async () => {
    if (!address || !ethers.utils.isAddress(address)) {
      setState({
        balance: null,
        balanceFormatted: null,
        isLoading: false,
        error: 'Invalid address provided',
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Create provider for Base network
      const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);

      // Create contract instance
      const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, ERC20_ABI, provider);

      // Fetch balance and decimals in parallel
      const [balance, decimals] = await Promise.all([
        usdcContract.balanceOf(address),
        usdcContract.decimals(),
      ]);

      // Format balance to human readable format
      const balanceFormatted = ethers.utils.formatUnits(balance, decimals);

      setState({
        balance: balance.toString(),
        balanceFormatted: parseFloat(balanceFormatted).toFixed(2),
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState({
        balance: null,
        balanceFormatted: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch USDC balance',
      });
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [address]);

  return {
    ...state,
    refetch: fetchBalance,
  };
};
