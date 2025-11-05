import { ethers } from 'ethers';
import { ERC20_ABI } from '@lit-protocol/vincent-ability-sdk';

import {
  ARBITRUM_USDC_ADDRESS_MAINNET,
  ARBITRUM_USDC_ADDRESS_TESTNET,
  DepositPrechecksResult,
} from '../types';

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
  const amountWei = ethers.utils.parseUnits(depositAmount, 6);

  const balance = await usdcContract.balanceOf(agentWalletPkpEthAddress);

  if (balance.lt(amountWei)) {
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
