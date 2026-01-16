import { Wallet, providers } from 'ethers';
import { LitContracts } from '@lit-protocol/contracts-sdk';

/**
 * Capacity token information
 */
interface CapacityToken {
  tokenId: bigint;
  isExpired: boolean;
}

const DATIL_RPC_URL = 'https://yellowstone-rpc.litprotocol.com/';
const DATIL_NETWORK = 'datil';

/**
 * Ensure a wallet has a valid, unexpired capacity credit
 * Capacity credits are required to execute Lit Actions (Vincent abilities)
 *
 * Note: Capacity credits are minted on Lit Protocol's Datil chain, not on the target chain
 * (e.g., Base Sepolia). This function creates a separate provider for Datil.
 *
 * @param targetWallet The wallet that needs the capacity credit (will be reconnected to Datil)
 */
export async function ensureUnexpiredCapacityToken(targetWallet: Wallet): Promise<void> {
  console.log(`=== Checking Capacity Credit for ${targetWallet.address} ===`);

  // Create a Datil provider and connect the wallet to it for capacity credit operations
  const datilProvider = new providers.JsonRpcProvider(DATIL_RPC_URL);
  const walletOnDatil = targetWallet.connect(datilProvider);

  const litContractClient = new LitContracts({
    debug: false,
    network: DATIL_NETWORK,
    signer: walletOnDatil,
    provider: datilProvider,
  });

  await litContractClient.connect();

  const existingTokens: CapacityToken[] =
    await litContractClient.rateLimitNftContractUtils.read.getTokensByOwnerAddress(
      walletOnDatil.address,
    );

  console.log(`Found ${existingTokens.length} capacity tokens`);

  if (existingTokens.length > 0 && existingTokens.some((token) => !token.isExpired)) {
    console.log('✅ Valid capacity credit already exists; skipping minting');
    return;
  }

  console.log(
    `No unexpired capacity credit found; minting new capacity credit for ${walletOnDatil.address}`,
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

  const balance = await walletOnDatil.getBalance();

  // Convert both to bigint for comparison
  const mintCostBigInt = BigInt(mintCost.toString());
  const balanceBigInt = BigInt(balance.toString());

  if (balanceBigInt < mintCostBigInt) {
    throw new Error(
      `${walletOnDatil.address} has insufficient balance to mint capacity credit: ${balance.toString()} < ${mintCost.toString()}. Please fund this wallet with Lit tokens at https://chronicle-yellowstone-faucet.getlit.dev/`,
    );
  }

  console.log(`Minting capacity credit (cost: ${mintCost.toString()} Lit tokens)...`);

  const capacityCreditInfo = await litContractClient.mintCapacityCreditsNFT({
    requestsPerKilosecond,
    daysUntilUTCMidnightExpiration,
  });

  console.log('✅ Capacity credit minted successfully:');
  console.log(`  Token ID: ${capacityCreditInfo.capacityTokenIdStr}`);
  console.log(`  Requests per kilosecond: ${requestsPerKilosecond}`);
  console.log(`  Expires: ${expirationDate.toISOString()}`);

  // Prune expired tokens if there are too many (performance optimization)
  if (existingTokens.filter((token) => token.isExpired).length > 10) {
    console.log('Pruning expired capacity credit tokens...');
    try {
      await litContractClient.rateLimitNftContractUtils.write.pruneExpired(walletOnDatil.address);
      console.log('✅ Expired tokens pruned');
    } catch (error: any) {
      console.log('⚠️  Failed to purge expired tokens:', error?.message || String(error));
    }
  }
}
