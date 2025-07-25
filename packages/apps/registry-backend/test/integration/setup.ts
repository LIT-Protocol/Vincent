import type { BaseQueryFn } from '@reduxjs/toolkit/query';

import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery, setupListeners } from '@reduxjs/toolkit/query';
import { providers, Wallet } from 'ethers';

import { create } from '@lit-protocol/vincent-app-sdk/jwt';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { nodeClient } from '@lit-protocol/vincent-registry-sdk';

const { vincentApiClientNode, setBaseQueryFn } = nodeClient;

const provider = new providers.JsonRpcProvider('https://yellowstone-rpc.litprotocol.com');

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

export type GenerateJWTFn = (wallet: Wallet) => Promise<string>;

export const generateJWT: GenerateJWTFn = async (wallet: Wallet) => {
  return await create({
    pkpWallet: wallet as any,
    pkp: {
      publicKey: wallet.publicKey, // Use the actual public key from the wallet
      ethAddress: wallet.address,
      tokenId: '1',
    },
    expiresInMinutes: 10,
    audience: 'localhost',
    authentication: {
      type: 'email',
      value: 'test@example.com',
    },
    payload: { customClaim: 'test-value' },
  });
};

// Create a wrapper function factory that adds authentication headers to mutation requests
export const createWithAuth = (
  wallet: Wallet = defaultWallet,
  generateJWTFn: GenerateJWTFn = generateJWT,
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

      // If it's a mutation, add auth
      const jwtStr = await generateJWTFn(wallet);
      const authHeader = `Bearer ${jwtStr}`;

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
