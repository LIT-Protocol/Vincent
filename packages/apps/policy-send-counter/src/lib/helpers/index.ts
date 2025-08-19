/**
 * Helper functions for the send-counter-limit policy
 * Integrates with the Counter smart contract to track send limits
 */

import { laUtils } from '@lit-protocol/vincent-scaffold-sdk/la-utils';

import { ethers } from 'ethers';

import { counterSignatures } from '../abi/counterSignatures';

/**
 * Check how many sends a user has made and if they can send again
 * @param userAddress - The user's address (PKP address)
 * @param maxSends - Maximum number of sends allowed
 * @param timeWindowSeconds - Time window in seconds before reset
 * @returns Send limit status and timing information
 */
export async function checkSendLimit(
  userAddress: string,
  maxSends: number,
  timeWindowSeconds: number,
): Promise<{
  allowed: boolean;
  currentCount: number;
  remainingSends: number;
  shouldReset?: boolean;
  secondsUntilReset?: number;
}> {
  try {
    // Create provider for contract calls
    const provider = new ethers.providers.JsonRpcProvider(
      'https://yellowstone-rpc.litprotocol.com/',
    );

    // Create contract instance
    const contract = new ethers.Contract(
      counterSignatures.address,
      [counterSignatures.methods.counterByAddress, counterSignatures.methods.lastIncrementTime],
      provider,
    );

    // Get current count and last increment time
    const [currentCount, lastIncrementTime] = await Promise.all([
      contract.counterByAddress(userAddress),
      contract.lastIncrementTime(userAddress),
    ]);

    const currentCountNum = currentCount.toNumber();
    const lastIncrementTimeNum = lastIncrementTime.toNumber();

    console.log(
      `Send limit check for ${userAddress}: ${currentCountNum} sends, last at ${lastIncrementTimeNum}`,
    );

    // If user has never sent before, they're allowed
    if (lastIncrementTimeNum === 0) {
      return {
        allowed: true,
        currentCount: currentCountNum,
        remainingSends: maxSends - currentCountNum,
      };
    }

    // Check if enough time has passed since last send
    const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
    const timeSinceLastSend = currentTime - lastIncrementTimeNum;
    const timeWindowElapsed = timeSinceLastSend >= timeWindowSeconds;

    // If time window has elapsed, user can send again (count effectively resets)
    if (timeWindowElapsed) {
      console.log(
        `Time window elapsed for ${userAddress}, allowing send (count will reset on next commit)`,
      );
      return {
        allowed: true,
        currentCount: 0, // Will be reset on next commit
        remainingSends: maxSends,
        shouldReset: true, // Flag to indicate reset is needed
      };
    }

    // Time window hasn't elapsed, check if under limit
    if (currentCountNum < maxSends) {
      return {
        allowed: true,
        currentCount: currentCountNum,
        remainingSends: maxSends - currentCountNum,
      };
    }

    // User has hit limit and time window hasn't elapsed
    const secondsUntilReset = timeWindowSeconds - timeSinceLastSend;
    return {
      allowed: false,
      currentCount: currentCountNum,
      remainingSends: 0,
      secondsUntilReset: Math.max(0, secondsUntilReset),
    };
  } catch (error) {
    console.error('Error checking send limit:', error);
    throw error;
  }
}

/**
 * Reset the send counter for a user by calling reset on the
 contract
 * @param userAddress - The user's address (PKP address)
 * @param pkpPublicKey - The PKP public key for signing
 */
export async function resetSendCounter(userAddress: string, pkpPublicKey: string): Promise<string> {
  console.log(`Resetting send counter for ${userAddress} on contract ${counterSignatures.address}`);

  try {
    const provider = new ethers.providers.JsonRpcProvider(
      'https://yellowstone-rpc.litprotocol.com/',
    );

    const txHash = await laUtils.transaction.handler.contractCall({
      provider,
      pkpPublicKey,
      callerAddress: userAddress,
      abi: [counterSignatures.methods.reset],
      contractAddress: counterSignatures.address,
      functionName: 'reset',
      args: [],
      overrides: {
        gasLimit: 100000,
      },
    });

    console.log(`Reset successful - TxHash: ${txHash}`);
    return txHash;
  } catch (error) {
    console.error('Error resetting send counter:', error);
    throw error;
  }
}
