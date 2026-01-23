import { useMemo } from 'react';
import { useAccount, useWalletClient, useDisconnect } from 'wagmi';
import { ethers } from 'ethers';
import type { WalletClient } from 'viem';

/**
 * Converts a viem WalletClient to an ethers v5 Signer.
 *
 * This conversion is necessary because:
 * - wagmi v2 uses viem for wallet interactions (returns WalletClient)
 * - @lit-protocol/vincent-contracts-sdk uses ethers v5 (expects ethers.Signer)
 *
 * If vincent-contracts-sdk is updated to use viem or ethers v6, this can be removed.
 */
export async function walletClientToSigner(walletClient: WalletClient): Promise<ethers.Signer> {
  const { account, chain, transport } = walletClient;

  if (!account) {
    throw new Error('WalletClient has no account connected');
  }

  if (!chain) {
    throw new Error('WalletClient has no chain connected');
  }

  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };

  // Create ethers v5 Web3Provider from viem transport
  const provider = new ethers.providers.Web3Provider(transport, network);
  const signer = provider.getSigner(account.address);

  return signer;
}

/**
 * Hook that provides wagmi wallet information and a function to get an ethers signer.
 * Replaces useReadAuthInfo and initPkpSigner for browser wallet signing.
 */
export function useWagmiSigner() {
  const { address, isConnected, isConnecting } = useAccount();
  const { data: walletClient, isLoading: isWalletClientLoading } = useWalletClient();
  const { disconnect } = useDisconnect();

  const isProcessing = isConnecting || isWalletClientLoading;

  /**
   * Gets an ethers v5 Signer from the connected wallet.
   * Call this when you need to perform blockchain transactions.
   */
  const getSigner = useMemo(() => {
    return async (): Promise<ethers.Signer> => {
      if (!walletClient) {
        throw new Error('No wallet connected. Please connect your wallet first.');
      }
      return walletClientToSigner(walletClient);
    };
  }, [walletClient]);

  return {
    /** The connected wallet address */
    address,
    /** Whether a wallet is connected */
    isConnected,
    /** Whether the wallet connection is in progress */
    isProcessing,
    /** Whether the wallet client is available */
    isReady: isConnected && !!walletClient,
    /** Function to get an ethers signer for transactions */
    getSigner,
    /** Function to disconnect the wallet */
    disconnect,
  };
}

export default useWagmiSigner;
