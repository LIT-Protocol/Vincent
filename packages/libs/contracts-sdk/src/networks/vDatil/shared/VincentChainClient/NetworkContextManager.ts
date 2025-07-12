import { GetWalletClientReturnType } from '@wagmi/core';
import { Account, createWalletClient, http, WalletClient } from 'viem';
import { vincentMainnetNetworkContext } from '../../datil-mainnet/vincentContext';

// TODO: We need to add more networks here
export const vincentNetworkContext = vincentMainnetNetworkContext;
// vincentTestnetNetworkContext |
// vincentDevNetworkContext;

export type VincentNetworkContext = typeof vincentNetworkContext;

export type ExpectedAccountOrWalletClient =
  | Account
  | WalletClient
  | GetWalletClientReturnType
  | any;

/**
 * Creates a Vincent network context for interacting with the Vincent blockchain
 *
 * @param {Object} params - The parameters for creating the network context
 * @param {Account} params.account - The account to use for transactions
 * @param {string} params.network - The network to connect to ('datil', 'datil-test', or 'datil-dev')
 * @returns {VincentNetworkContext} The configured network context with wallet client
 * @throws {Error} If an unsupported network is specified
 */
export const createVincentNetworkContext = ({
  accountOrWalletClient,
  network,
}: {
  accountOrWalletClient: ExpectedAccountOrWalletClient;
  network: 'datil' | 'datil-test' | 'datil-dev';
}) => {
  let networkContext = {} as VincentNetworkContext;

  if (network === 'datil') {
    networkContext = vincentMainnetNetworkContext;
  } else if (network === 'datil-test') {
    // networkContext = vincentTestnetNetworkContext;
    throw new Error('datil-test network not implemented');
  } else if (network === 'datil-dev') {
    // networkContext = vincentDevnetNetworkContext;
    throw new Error('datil-dev network not implemented');
  }

  // If a wallet client is already provided, use it directly
  if (accountOrWalletClient.type === 'local') {
    // If an account is provided, create a wallet client with it
    const walletClient = createWalletClient({
      account: accountOrWalletClient as Account,
      chain: networkContext.chainConfig.chain,
      transport: http(networkContext.rpcUrl),
    });
    networkContext.walletClient = walletClient;
  } else {
    networkContext.walletClient = accountOrWalletClient as WalletClient;
  }

  return networkContext;
};
