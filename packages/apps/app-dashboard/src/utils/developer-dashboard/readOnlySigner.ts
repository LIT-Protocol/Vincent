import { ethers } from 'ethers';
import { env } from '@/config/env';

const { VITE_VINCENT_BASE_SEPOLIA_RPC } = env;

export const readOnlySigner = new ethers.Wallet(
  ethers.Wallet.createRandom().privateKey,
  new ethers.providers.JsonRpcProvider(VITE_VINCENT_BASE_SEPOLIA_RPC),
);
