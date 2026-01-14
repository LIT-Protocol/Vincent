import type { BaseQueryFn } from '@reduxjs/toolkit/query';

import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery, setupListeners } from '@reduxjs/toolkit/query';
import { providers, Wallet } from 'ethers';
import { SiweMessage } from 'siwe';

import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { nodeClient } from '@lit-protocol/vincent-registry-sdk';

const { vincentApiClientNode, setBaseQueryFn } = nodeClient;

// Use BASE_RPC_URL for contract interactions (app registration happens on Base)
const BASE_RPC_URL = process.env['BASE_RPC_URL'];
if (!BASE_RPC_URL) {
  throw new Error('BASE_RPC_URL environment variable is not set');
}
const provider = new providers.JsonRpcProvider(BASE_RPC_URL);

// Generate random Ethereum addresses
export const generateRandomEthAddresses = (count = 2): string[] => {
  const addresses: string[] = [];
  for (let i = 0; i < count; i++) {
    // Create a random wallet and use its address
    const wallet = Wallet.createRandom();
    addresses.push(wallet.address);
  }
  return addresses;
};

// Default wallet for testing
const TEST_APP_MANAGER_PRIVATE_KEY = process.env['TEST_APP_MANAGER_PRIVATE_KEY'];

if (!TEST_APP_MANAGER_PRIVATE_KEY)
  throw new Error(
    'TEST_APP_MANAGER_PRIVATE_KEY environment variable is not set. Please set it to a private key for a wallet that can manage apps.',
  );

export const defaultWallet = new Wallet(
  process.env['TEST_APP_MANAGER_PRIVATE_KEY'] ||
    '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  provider,
);

export const getDefaultWalletContractClient = () => getClient({ signer: defaultWallet });

export type GenerateSIWEAuthFn = (wallet: Wallet) => Promise<string>;

/**
 * Generate a SIWE authentication header value for a wallet
 * Returns a base64-encoded JSON string containing the SIWE message and signature
 */
export const generateSIWEAuth: GenerateSIWEAuthFn = async (wallet: Wallet) => {
  const domain = 'localhost';
  const uri = `http://${domain}`;
  const now = new Date();
  const expirationTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

  const siweMessage = new SiweMessage({
    domain,
    address: wallet.address,
    statement: 'Sign in to Vincent Registry',
    uri,
    version: '1',
    chainId: 1,
    nonce: Math.random().toString(36).substring(2, 15),
    issuedAt: now.toISOString(),
    expirationTime: expirationTime.toISOString(),
  });

  const message = siweMessage.prepareMessage();
  const signature = await wallet.signMessage(message);

  const payload = JSON.stringify({ message, signature });
  return Buffer.from(payload).toString('base64');
};

// Create a wrapper function factory that adds authentication headers to mutation requests
export const createWithAuth = (
  wallet: Wallet = defaultWallet,
  generateAuthFn: GenerateSIWEAuthFn = generateSIWEAuth,
) => {
  return (baseQuery: BaseQueryFn): BaseQueryFn => {
    return async (args, api, extraOptions) => {
      // Check if this is a mutation request (has a method other than GET or undefined)
      const isMutation =
        args &&
        typeof args === 'object' &&
        'method' in args &&
        args.method &&
        args.method !== 'GET';

      if (!isMutation) {
        // Non mutation endpoints don't get auth headers as of yet <3
        return baseQuery(args, api, extraOptions);
      }

      // If it's a mutation, add SIWE auth
      const siweAuth = await generateAuthFn(wallet);
      const authHeader = `SIWE ${siweAuth}`;

      // Pass the request to the original fetchBaseQuery function but with authorization headers added :tada:
      return baseQuery(
        {
          ...args,
          headers: {
            ...args.headers,
            authorization: authHeader,
          },
        },
        api,
        extraOptions,
      );
    };
  };
};

// Create the default withSiweAuth function using the default wallet
export const withAuth = createWithAuth();

// FIXME: Identify port from jest-process-manager
setBaseQueryFn(
  withAuth(fetchBaseQuery({ baseUrl: `http://localhost:${process.env.PORT || 3000}` })),
);

export { vincentApiClientNode };
export const api = vincentApiClientNode;

// Create a store with the API reducer
export const store = configureStore({
  reducer: {
    [vincentApiClientNode.reducerPath]: vincentApiClientNode.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(vincentApiClientNode.middleware),
});

setupListeners(store.dispatch);
