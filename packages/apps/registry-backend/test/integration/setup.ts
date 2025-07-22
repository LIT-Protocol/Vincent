import type { BaseQueryFn } from '@reduxjs/toolkit/query';

import { configureStore } from '@reduxjs/toolkit';
import { fetchBaseQuery, setupListeners } from '@reduxjs/toolkit/query';
import { providers, Wallet } from 'ethers';
import { SiweMessage } from 'siwe';

import { nodeClient } from '@lit-protocol/vincent-registry-sdk';

const { vincentApiClientNode, setBaseQueryFn } = nodeClient;

const provider = new providers.JsonRpcProvider('https://yellowstone-rpc.litprotocol.com');

// Generate a secure random nonce
export const generateNonce = () => {
  const array = new Uint8Array(16);
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

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

// Function to generate a SIWE message
export type GenerateSiweMessageFn = (
  wallet: Wallet,
) => Promise<{ message: string; signature: string }>;

export const generateSiweMessage: GenerateSiweMessageFn = async (wallet: Wallet) => {
  const domain = 'localhost';
  const statement = 'Sign in with Ethereum to authenticate with Vincent Registry API';
  const nonce = generateNonce();
  const siweMessage = new SiweMessage({
    domain,
    address: wallet.address,
    statement,
    uri: `http://localhost:${process.env.PORT || 3000}`,
    version: '1',
    chainId: 1,
    nonce,
    issuedAt: new Date().toISOString(),
  });

  // Prepare the message for signing
  const message = siweMessage.prepareMessage();

  // Sign the message
  const signature = await wallet.signMessage(message);

  return { message, signature };
};

// Create a wrapper function factory that adds authentication headers to mutation requests
export const createWithSiweAuth = (
  wallet: Wallet = defaultWallet,
  generateSiweFn: GenerateSiweMessageFn = generateSiweMessage,
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

      // If it's a mutation, add the SIWE authentication header
      // Generate SIWE message and signature
      const { message, signature } = await generateSiweFn(wallet);

      // Format the Authorization header value - Base64 encode the payload
      const payload = JSON.stringify({ message, signature });
      const base64Payload = Buffer.from(payload).toString('base64');
      const authHeader = `SIWE ${base64Payload}`;

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
export const withSiweAuth = createWithSiweAuth();

// FIXME: Identify port from jest-process-manager
setBaseQueryFn(
  withSiweAuth(fetchBaseQuery({ baseUrl: `http://localhost:${process.env.PORT || 3000}` })),
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
