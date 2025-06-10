import { LitContracts } from '@lit-protocol/contracts-sdk';
import { ethers } from 'ethers';

export interface CapacityCreditMintOptions {
  requestsPerKilosecond?: number;
  daysUntilUTCMidnightExpiration?: number;
}

export interface CapacityCreditInfo {
  capacityTokenIdStr: string;
  capacityTokenId: string;
  requestsPerKilosecond: number;
  daysUntilUTCMidnightExpiration: number;
  mintedAtUtc: string;
}

/**
 * Custom error class for capacity credit minting failures
 */
export class MintCapacityTokenFailure extends Error {
  public readonly info: {
    requestsPerKilosecond?: number;
    daysUntilUTCMidnightExpiration?: number;
    mintCost?: string;
    balance?: string;
    signerAddress?: string;
  };

  constructor(message: string, info: MintCapacityTokenFailure['info'] = {}, cause?: Error) {
    super(message);
    this.name = 'MintCapacityTokenFailure';
    this.info = info;

    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Mint a capacity credit NFT on the Lit Datil network
 *
 * @param litContracts - Connected LitContracts instance
 * @param options - Minting options including requestsPerKilosecond and daysUntilUTCMidnightExpiration
 * @returns Promise<CapacityCreditInfo> - Information about the minted capacity credit
 * @throws {MintCapacityTokenFailure} - When minting fails for any reason
 */
export async function mintCapacityCredit(
  litContracts: LitContracts,
  {
    requestsPerKilosecond = 10,
    daysUntilUTCMidnightExpiration = 30,
  }: CapacityCreditMintOptions = {},
): Promise<CapacityCreditInfo> {
  // Validation
  if (!litContracts) {
    throw new MintCapacityTokenFailure('LitContracts instance is required');
  }

  if (!litContracts.connected) {
    throw new MintCapacityTokenFailure('LitContracts instance must be connected before minting');
  }

  if (requestsPerKilosecond <= 0) {
    throw new MintCapacityTokenFailure('requestsPerKilosecond must be greater than 0', {
      requestsPerKilosecond,
    });
  }

  if (daysUntilUTCMidnightExpiration <= 0) {
    throw new MintCapacityTokenFailure('daysUntilUTCMidnightExpiration must be greater than 0', {
      daysUntilUTCMidnightExpiration,
    });
  }

  let signerAddress: string;
  let mintCost: ethers.BigNumber;
  let balance: ethers.BigNumber;

  try {
    // Get signer address for logging and error reporting
    signerAddress = await litContracts.signer.getAddress();

    console.log('Minting capacity credit with parameters:', {
      requestsPerKilosecond,
      daysUntilUTCMidnightExpiration,
      signerAddress,
    });

    // Calculate expiration timestamp at UTC midnight
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

    console.log('Calculated expiration:', {
      expirationDate: expirationDate.toISOString(),
      expiresAt,
    });

    // Calculate mint cost
    mintCost = await litContracts.rateLimitNftContract.read.calculateCost(
      requestsPerKilosecond,
      expiresAt,
    );

    // Check balance
    balance = await litContracts.signer.getBalance();

    console.log('Mint cost and balance:', {
      mintCost: ethers.utils.formatEther(mintCost),
      balance: ethers.utils.formatEther(balance),
      sufficient: balance.gte(mintCost),
    });

    if (mintCost.gt(balance)) {
      throw new MintCapacityTokenFailure(
        `Insufficient balance to mint capacity credit. Required: ${ethers.utils.formatEther(
          mintCost,
        )} ETH, Available: ${ethers.utils.formatEther(balance)} ETH`,
        {
          requestsPerKilosecond,
          daysUntilUTCMidnightExpiration,
          mintCost: ethers.utils.formatEther(mintCost),
          balance: ethers.utils.formatEther(balance),
          signerAddress,
        },
      );
    }

    // Mint the capacity credit
    console.log('Calling mintCapacityCreditsNFT...');
    const capacityCreditInfo = await litContracts.mintCapacityCreditsNFT({
      requestsPerKilosecond,
      daysUntilUTCMidnightExpiration,
    });

    const result: CapacityCreditInfo = {
      capacityTokenIdStr: capacityCreditInfo.capacityTokenIdStr,
      capacityTokenId: capacityCreditInfo.capacityTokenId,
      requestsPerKilosecond,
      daysUntilUTCMidnightExpiration,
      mintedAtUtc: new Date().toISOString(),
    };

    console.log('Successfully minted capacity credit:', result);

    return result;
  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error instanceof MintCapacityTokenFailure) {
      throw error;
    }

    // Convert other errors to our custom error type
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error('Failed to mint capacity credit:', {
      error: errorMessage,
      requestsPerKilosecond,
      daysUntilUTCMidnightExpiration,
      signerAddress: signerAddress!,
    });

    // Create detailed error info
    const errorInfo: MintCapacityTokenFailure['info'] = {
      requestsPerKilosecond,
      daysUntilUTCMidnightExpiration,
      signerAddress: signerAddress!,
    };

    // Add cost and balance info if we got that far
    if (mintCost! && balance!) {
      errorInfo.mintCost = ethers.utils.formatEther(mintCost);
      errorInfo.balance = ethers.utils.formatEther(balance);
    }

    throw new MintCapacityTokenFailure(
      `Failed to mint capacity credit: ${errorMessage}`,
      errorInfo,
      error instanceof Error ? error : new Error(errorMessage),
    );
  }
}
