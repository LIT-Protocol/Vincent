import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { litNodeClient } from '@/components/consent/utils/lit';
// Store the PKP wallet instance
let pkpWallet: PKPEthersWallet | null = null;
// Store the current PKP address to detect wallet changes
let currentPKPAddress: string | null = null;

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
  const { createWalletConnectClient, resetWalletConnectClient } = await import(
    './WalletConnectUtil'
  );
  const { getWalletConnectActions, getCurrentWalletAddress } = await import('./WalletConnectStore');

  if (!agentPKP?.ethAddress) {
    throw new Error('PKP does not have an Ethereum address');
  }

  // Check if the wallet address has changed
  const newAddress = agentPKP.ethAddress;
  const storedWalletAddress = getCurrentWalletAddress();
  const walletHasChanged = storedWalletAddress !== null && storedWalletAddress !== newAddress;

  // Get the actions from the store
  const actions = getWalletConnectActions();

  // If the wallet has changed, we need to disconnect sessions from the old wallet
  if (walletHasChanged) {
    console.log(`Wallet has changed from ${storedWalletAddress} to ${newAddress}`);

    // First disconnect any sessions associated with the previous wallet to ensure
    // dApps know that wallet has been disconnected
    if (storedWalletAddress) {
      console.log(`Disconnecting all sessions for previous wallet: ${storedWalletAddress}`);
      try {
        await actions.clearSessionsForAddress(storedWalletAddress);
      } catch (error) {
        console.error('Error disconnecting sessions for previous wallet:', error);
      }
    }

    // Reset client to ensure clean state
    await resetWalletConnectClient();

    // Update the current wallet address in the store
    actions.setCurrentWalletAddress(newAddress);
  } else if (newAddress && storedWalletAddress !== newAddress) {
    // First time setting this wallet or wallet address isn't tracked yet
    console.log(`Setting current wallet address to ${newAddress}`);
    actions.setCurrentWalletAddress(newAddress);
  }

  // Store the new address
  currentPKPAddress = newAddress;

  // Get or create the client
  const client = await createWalletConnectClient();

  if (!client) {
    throw new Error('WalletKit client not initialized');
  }

  // If session signatures are provided, create an actual PKP wallet for signing
  if (sessionSigs) {
    try {
      // Clear existing wallet if we're creating a new one
      if (pkpWallet) {
        pkpWallet = null;
      }

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
    chainId: '1',
  };
}

/**
 * Get the initialized PKP wallet instance
 * @returns The PKP wallet instance or null if not initialized
 */
export function getPKPWallet(): PKPEthersWallet | null {
  return pkpWallet;
}

/**
 * Get the current PKP address
 * @returns The current PKP address or null if not set
 */
export function getCurrentPKPAddress(): string | null {
  return currentPKPAddress;
}
