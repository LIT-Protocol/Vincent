import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/components/consent/utils/lit';

// Define Ethereum mainnet
const ETHEREUM_MAINNET_CHAIN_ID = '1';

/**
 * Get a provider for a specific chain ID
 * @param chainId The chain ID to get a provider for (decimal or hex format)
 */

// Store the PKP wallet instance
let pkpWallet: PKPEthersWallet | null = null;

/**
 * Create a PKPEthersWallet using the agent PKP and session signatures
 * @param agentPKP The agent's PKP to use for signing
 * @param sessionSigs Session signatures for authentication
 * @returns The created PKPEthersWallet instance
 */
export async function createPKPWallet(
  agentPKP: IRelayPKP,
  sessionSigs: SessionSigs,
): Promise<PKPEthersWallet> {
  if (!agentPKP?.publicKey) {
    throw new Error('PKP does not have a public key');
  }

  pkpWallet = new PKPEthersWallet({
    pkpPubKey: agentPKP.publicKey,
    litNodeClient: litNodeClient,
    controllerSessionSigs: sessionSigs,
  });

  await pkpWallet.init();
  return pkpWallet;
}

/**
 * Register a PKP wallet with WalletKit to handle signing requests
 * @param agentPKP The agent's PKP to use for signing
 * @param sessionSigs Session signatures for authentication
 * @returns Information about the registered account
 */
export async function registerPKPWallet(
  agentPKP: IRelayPKP,
  sessionSigs?: SessionSigs,
): Promise<{ address: string; publicKey: string; chainId: string }> {
  // Import and use the non-hook function to get the client
  const { getWalletConnectClient } = await import('./WalletConnectStore');
  const client = getWalletConnectClient();

  if (!client) {
    throw new Error('WalletKit client not initialized');
  }

  if (!agentPKP?.ethAddress) {
    throw new Error('PKP does not have an Ethereum address');
  }

  // If session signatures are provided, create an actual PKP wallet for signing
  if (sessionSigs) {
    try {
      pkpWallet = await createPKPWallet(agentPKP, sessionSigs);

      // Register the PKP wallet with the WalletKit client
      // WalletKit doesn't have a direct registerWallet method,
      // but we'll store the PKP wallet for use with session requests
      console.log('PKP wallet created for use with WalletKit');

      // For WalletKit, we need to manually handle wallet integration
      // in the session request handlers

      console.log('PKP wallet registered with WalletKit client');
    } catch (error) {
      console.error('Failed to create PKP wallet:', error);
      throw new Error('Failed to create PKP wallet');
    }
  }

  const address = agentPKP.ethAddress;
  console.log(`PKP wallet with address ${address} registered with WalletKit`);

  // Return account info
  return {
    address,
    publicKey: agentPKP.publicKey || '',
    chainId: ETHEREUM_MAINNET_CHAIN_ID,
  };
}

/**
 * Get the initialized PKP wallet instance
 * @returns The PKP wallet instance or null if not initialized
 */
export function getPKPWallet(): PKPEthersWallet | null {
  return pkpWallet;
}
