import { ethers } from 'ethers';
import { ERC20_ABI } from '@lit-protocol/vincent-ability-sdk';

import { ARBITRUM_USDC_ADDRESS_MAINNET, ARBITRUM_USDC_ADDRESS_TESTNET } from '../types';

export type DepositPrechecksResult = DepositPrechecksResultSuccess | DepositPrechecksResultFailure;

export interface DepositPrechecksResultSuccess {
  success: true;
  balance: string;
}

export interface DepositPrechecksResultFailure {
  success: false;
  reason: string;
  balance: string;
}

export const depositPrechecks = async ({
  provider,
  agentWalletPkpEthAddress,
  depositAmount,
  useTestnet = false,
}: {
  provider: ethers.providers.Provider;
  agentWalletPkpEthAddress: string;
  depositAmount: string;
  useTestnet?: boolean;
}): Promise<DepositPrechecksResult> => {
  const usdcAddress = useTestnet ? ARBITRUM_USDC_ADDRESS_TESTNET : ARBITRUM_USDC_ADDRESS_MAINNET;
  const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, provider);
  const amountInMicroUsdc = ethers.utils.parseUnits(depositAmount, 6);

  const balance = await usdcContract.balanceOf(agentWalletPkpEthAddress);

  if (balance.lt(amountInMicroUsdc)) {
    return {
      success: false,
      reason: `Insufficient USDC balance. Required: ${depositAmount} USDC, Available: ${ethers.utils.formatUnits(balance, 6)} USDC`,
      balance: ethers.utils.formatUnits(balance, 6),
    };
  }

  return {
    success: true,
    balance: ethers.utils.formatUnits(balance, 6),
  };
};
