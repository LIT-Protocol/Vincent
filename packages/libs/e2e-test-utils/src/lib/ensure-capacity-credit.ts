import { ethers } from 'ethers';

import type { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

import type { CapacityToken } from './types';

import { getLitContractsClient } from './litContractsClient/get-lit-contract-client';

export const ensureUnexpiredCapacityToken = async (
  targetWallet: ethers.Wallet | PKPEthersWallet,
) => {
  const litContractClient = await getLitContractsClient({
    wallet: targetWallet,
  });
  await litContractClient.connect();

  const existingTokens: CapacityToken[] =
    await litContractClient.rateLimitNftContractUtils.read.getTokensByOwnerAddress(
      await targetWallet.getAddress(),
    );

  console.log(`Found ${existingTokens.length} capacity tokens`);
  if (existingTokens.length > 0 && existingTokens.some((token) => !token.isExpired)) {
    console.log('Capacity credit already exists; skipping minting');
  } else {
    console.log(
      `No unexpired capacity credit found; minting new capacity credit for ${targetWallet.getAddress()}`,
    );

    const daysUntilUTCMidnightExpiration = 3;
    const requestsPerKilosecond = 1000;
    const now = new Date();
    const expirationDate = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + daysUntilUTCMidnightExpiration,
        0,
        0,
        0,
        0, // Set to midnight UTC
      ),
    );
    const expiresAt = Math.floor(expirationDate.getTime() / 1000); // Convert to Unix timestamp

    const mintCost = await litContractClient.rateLimitNftContract.read.calculateCost(
      requestsPerKilosecond,
      expiresAt,
    );

    const balance = await targetWallet.getBalance();

    if (mintCost.gte(balance)) {
      throw new Error(
        `${targetWallet.getAddress()} has insufficient balance to mint capacity credit: ${ethers.utils.formatEther(
          balance,
        )} <= ${ethers.utils.formatEther(mintCost)}`,
      );
    }

    const capacityCreditInfo = await litContractClient.mintCapacityCreditsNFT({
      requestsPerKilosecond,
      daysUntilUTCMidnightExpiration,
    });

    console.log({
      capacityTokenIdStr: capacityCreditInfo.capacityTokenIdStr,
      capacityTokenId: capacityCreditInfo.capacityTokenId,
      requestsPerKilosecond,
      daysUntilUTCMidnightExpiration,
      mintedAtUtc: new Date().toISOString(),
    });
  }

  // If we have more than 'a few' expired tokens, we should purge them to ensure performance is not impacted.
  // This is an arbitrary number (generally you're GTG unless there are hundreds)...
  // but it's a good heuristic to avoid a situation where we have a lot of expired tokens
  if (existingTokens.filter((token) => token.isExpired).length > 10) {
    console.log('Detected some expired capacity credit tokens; pruning');

    // Purge any existing but expired tokens for performance reasons
    // Listing a lot of tokens is expensive -- and we just need one, unexpired one!)
    try {
      await litContractClient.rateLimitNftContractUtils.write.pruneExpired(
        await targetWallet.getAddress(),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.log('Failed to purge expired tokens:', error?.message || String(error));
    }
  }
};
