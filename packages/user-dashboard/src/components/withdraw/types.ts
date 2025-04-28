import { ethers } from 'ethers';

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  rawBalance: ethers.BigNumber;
  decimals: number;
  logoUrl?: string;
}

export type StatusType = 'info' | 'warning' | 'success' | 'error'; 