import { LitContracts } from '@lit-protocol/contracts-sdk';
import { ethers } from 'ethers';

import {
  mintCapacityCredit,
  CapacityCreditMintOptions,
  CapacityCreditInfo,
} from './mint-lit-capacity-credit';
import { LIT_NETWORK } from '@lit-protocol/constants';

type CapacityToken = {
  capacity: {
    expiresAt: {
      timestamp: number;
      formatted: string;
    };
  };
  tokenId: number;
  isExpired: boolean;
};

type CheckMintLitCapacityCreditParams = {
  creditOwnerEthersWallet: ethers.Wallet;
  mintOptions?: CapacityCreditMintOptions;
  shouldMintIfNeeded?: boolean;
};

type CheckMintLitCapacityCreditResult = {
  hasValidCapacityCredit: boolean;
  capacityCreditInfo?: CapacityCreditInfo;
  unexpiredTokens?: Array<{ expiresAt: string; tokenId: number }>;
  action: 'minted' | 'existing_valid' | 'no_action';
};

// Helper function to check if two dates are the same day
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Helper function to add days to a date
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const checkMintLitCapacityCredit = async ({
  creditOwnerEthersWallet,
  mintOptions = {},
  shouldMintIfNeeded = true,
}: CheckMintLitCapacityCreditParams): Promise<CheckMintLitCapacityCreditResult> => {
  if (!creditOwnerEthersWallet) {
    throw new Error('creditOwnerEthersWallet is required');
  }

  const litContractClient = new LitContracts({
    signer: creditOwnerEthersWallet,
    network: LIT_NETWORK.Datil,
  });
  await litContractClient.connect();

  // Fetch existing tokens for the recipient address
  const existingTokens: CapacityToken[] =
    await litContractClient.rateLimitNftContractUtils.read.getTokensByOwnerAddress(
      creditOwnerEthersWallet.address,
    );

  // Check if the recipient has usable tokens for tomorrow
  const today = new Date();
  const tomorrow = addDays(today, 1);

  // Only mint a new token if the recipient...
  // 1. Has no NFTs at all
  // 2. All unexpired NFTs they have will expire later today or tomorrow
  // 3. All of their NFTs are already expired
  const noUsableTokensTomorrow = existingTokens.every((token) => {
    // NOTE: `every()` on an empty array === true :)
    const {
      capacity: {
        expiresAt: { timestamp },
      },
      isExpired,
    } = token;

    if (isExpired) {
      return true;
    }

    const tokenExpiresDate = new Date(timestamp * 1000);
    return isSameDay(tokenExpiresDate, tomorrow) || isSameDay(tokenExpiresDate, today);
  });

  const unexpiredTokens = existingTokens
    .filter(({ isExpired }) => !isExpired)
    .map((token) => ({
      tokenId: token.tokenId,
      expiresAt: token.capacity.expiresAt.formatted,
    }));

  if (noUsableTokensTomorrow) {
    // Need to mint a new capacity credit
    if (!shouldMintIfNeeded) {
      return {
        hasValidCapacityCredit: false,
        unexpiredTokens,
        action: 'no_action',
      };
    }

    const capacityCreditInfo = await mintCapacityCredit(litContractClient, mintOptions);

    return {
      hasValidCapacityCredit: true,
      capacityCreditInfo,
      action: 'minted',
    };
  }

  // Has valid capacity credits
  return {
    hasValidCapacityCredit: true,
    unexpiredTokens,
    action: 'existing_valid',
  };
};
