import { Wallet, providers } from 'ethers';
import { LitContracts } from '@lit-protocol/contracts-sdk';

interface CapacityToken {
  tokenId: bigint;
  isExpired: boolean;
}

export type NewCapacityCreditInfo = {
  capacityTokenIdStr: string;
  capacityTokenId: string;
  requestsPerKilosecond: number;
  daysUntilUTCMidnightExpiration: number;
  mintedAtUtc: string;
  expiresAt: string;
};

const DATIL_NETWORK = 'datil';
const YELLOWSTONE_RPC_URL = 'https://yellowstone-rpc.litprotocol.com/';

export async function ensureWalletHasUnexpiredCapacityCredit({
  privateKey,
}: {
  privateKey: `0x${string}`;
}): Promise<{
  mintedNewCapacityCredit: boolean;
  newCapacityCreditInfo?: NewCapacityCreditInfo;
}> {
  // Create ethers provider and wallet for LitContracts SDK
  const yellowstoneProvider = new providers.JsonRpcProvider(YELLOWSTONE_RPC_URL);
  const ethersWallet = new Wallet(privateKey, yellowstoneProvider);

  const litContractClient = new LitContracts({
    debug: false,
    network: DATIL_NETWORK,
    signer: ethersWallet,
    provider: yellowstoneProvider,
  });

  await litContractClient.connect();

  const existingTokens: CapacityToken[] =
    await litContractClient.rateLimitNftContractUtils.read.getTokensByOwnerAddress(
      ethersWallet.address,
    );

  if (existingTokens.length > 0 && existingTokens.some((token) => !token.isExpired)) {
    return { mintedNewCapacityCredit: false };
  }

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

  const balance = await ethersWallet.provider!.getBalance(ethersWallet.address);

  // Convert both to bigint for comparison
  const mintCostBigInt = BigInt(mintCost.toString());
  const balanceBigInt = BigInt(balance.toString());

  if (balanceBigInt < mintCostBigInt) {
    throw new Error(
      `${ethersWallet.address} has insufficient balance to mint capacity credit: ${balance.toString()} < ${mintCost.toString()}. Please fund this wallet with Lit tokens at https://chronicle-yellowstone-faucet.getlit.dev/`,
    );
  }

  const mintedCapacityCreditReponse = await litContractClient.mintCapacityCreditsNFT({
    requestsPerKilosecond,
    daysUntilUTCMidnightExpiration,
  });

  // Prune expired tokens if there are too many (performance optimization)
  if (existingTokens.filter((token) => token.isExpired).length > 10) {
    console.log('Pruning expired capacity credit tokens...');
    try {
      await litContractClient.rateLimitNftContractUtils.write.pruneExpired(ethersWallet.address);
      console.log('Expired tokens pruned');
    } catch (error: any) {
      console.log('⚠️ Failed to purge expired tokens:', error?.message || String(error));
    }
  }

  return {
    mintedNewCapacityCredit: true,
    newCapacityCreditInfo: {
      capacityTokenIdStr: mintedCapacityCreditReponse.capacityTokenIdStr,
      capacityTokenId: mintedCapacityCreditReponse.capacityTokenId,
      requestsPerKilosecond,
      daysUntilUTCMidnightExpiration,
      mintedAtUtc: new Date().toISOString(),
      expiresAt: expirationDate.toISOString(),
    },
  };
}
