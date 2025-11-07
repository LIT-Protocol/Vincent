import { ethers } from 'ethers';
import { ERC20_ABI } from '@lit-protocol/vincent-ability-sdk';

import { ARBITRUM_USDC_ADDRESS_MAINNET, ARBITRUM_USDC_ADDRESS_TESTNET } from '../types';

export type DepositPrechecksResult = DepositPrechecksResultSuccess | DepositPrechecksResultFailure;

export interface DepositPrechecksResultSuccess {
  success: true;
  availableBalance: string;
}

export interface DepositPrechecksResultFailure {
  success: false;
  reason: string;
  availableBalance?: string;
}

// https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/bridge2#deposit
const MIN_USDC_DEPOSIT_AMOUNT = ethers.BigNumber.from('5000000');

export const depositPrechecks = async ({
  provider,
  agentWalletPkpEthAddress,
  depositAmountInMicroUsdc,
  useTestnet = false,
}: {
  provider: ethers.providers.Provider;
  agentWalletPkpEthAddress: string;
  depositAmountInMicroUsdc: string;
  useTestnet?: boolean;
}): Promise<DepositPrechecksResult> => {
  const usdcAddress = useTestnet ? ARBITRUM_USDC_ADDRESS_TESTNET : ARBITRUM_USDC_ADDRESS_MAINNET;
  const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, provider);

  const ethBalance = await provider.getBalance(agentWalletPkpEthAddress);
  if (ethBalance.eq(0n)) {
    return {
      success: false,
      reason: `Agent Wallet PKP has no ETH balance. Please fund the Agent Wallet PKP with ETH`,
    };
  }

  const usdcBalance = await usdcContract.balanceOf(agentWalletPkpEthAddress);
  const _depositAmountInMicroUsdc = ethers.BigNumber.from(depositAmountInMicroUsdc);
  if (_depositAmountInMicroUsdc.lt(MIN_USDC_DEPOSIT_AMOUNT)) {
    return {
      success: false,
      reason: `Deposit amount is less than the minimum deposit amount. Minimum deposit amount required: ${ethers.utils.formatUnits(MIN_USDC_DEPOSIT_AMOUNT, 6)} USDC`,
      availableBalance: ethers.utils.formatUnits(usdcBalance, 6),
    };
  }

  if (usdcBalance.lt(_depositAmountInMicroUsdc)) {
    return {
      success: false,
      reason: `Insufficient USDC balance. Attempted deposit amount: ${ethers.utils.formatUnits(depositAmountInMicroUsdc, 6)} USDC, Available balance: ${ethers.utils.formatUnits(usdcBalance, 6)} USDC`,
      availableBalance: ethers.utils.formatUnits(usdcBalance, 6),
    };
  }

  return {
    success: true,
    availableBalance: ethers.utils.formatUnits(usdcBalance, 6),
  };
};
