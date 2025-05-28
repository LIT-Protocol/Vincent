import { createPublicClient, createWalletClient, defineChain, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import path from 'path';

import { getEnv } from './test-config';

export const YELLOWSTONE_RPC_URL = getEnv('YELLOWSTONE_RPC_URL');
export const BASE_RPC_URL = getEnv('BASE_RPC_URL');
export const TEST_CONFIG_PATH = path.join(__dirname, '../test-config.json');
export const VINCENT_ADDRESS = getEnv('VINCENT_ADDRESS');

export const ERC20_APPROVAL_TOOL_IPFS_ID = getEnv('ERC20_APPROVAL_TOOL_IPFS_ID');
export const UNISWAP_SWAP_TOOL_IPFS_ID = getEnv('UNISWAP_SWAP_TOOL_IPFS_ID');
export const SPENDING_LIMIT_POLICY_IPFS_ID = getEnv('SPENDING_LIMIT_POLICY_IPFS_ID');

export const DATIL_CHAIN = defineChain({
  id: 175188,
  name: 'Datil Mainnet',
  network: 'datil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [YELLOWSTONE_RPC_URL],
    },
    public: {
      http: [YELLOWSTONE_RPC_URL],
    },
  },
});
export const DATIL_PUBLIC_CLIENT = createPublicClient({
  chain: DATIL_CHAIN,
  transport: http(YELLOWSTONE_RPC_URL),
});

export const BASE_CHAIN = defineChain({
  id: 8453,
  name: 'Base Mainnet',
  network: 'base',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [BASE_RPC_URL],
    },
    public: {
      http: [BASE_RPC_URL],
    },
  },
});
export const BASE_PUBLIC_CLIENT = createPublicClient({
  chain: BASE_CHAIN,
  transport: http(BASE_RPC_URL),
});

export const TEST_FUNDER_PRIVATE_KEY = getEnv('TEST_FUNDER_PRIVATE_KEY');
export const TEST_FUNDER_VIEM_ACCOUNT = privateKeyToAccount(
  TEST_FUNDER_PRIVATE_KEY as `0x${string}`,
);
export const TEST_FUNDER_VIEM_WALLET_CLIENT = createWalletClient({
  account: TEST_FUNDER_VIEM_ACCOUNT,
  chain: DATIL_CHAIN,
  transport: http(YELLOWSTONE_RPC_URL),
});

export const TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY = getEnv(
  'TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY',
);
export const TEST_AGENT_WALLET_PKP_OWNER_VIEM_ACCOUNT = privateKeyToAccount(
  TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as `0x${string}`,
);

export const TEST_APP_MANAGER_PRIVATE_KEY = getEnv('TEST_APP_MANAGER_PRIVATE_KEY');
export const TEST_APP_MANAGER_VIEM_ACCOUNT = privateKeyToAccount(
  TEST_APP_MANAGER_PRIVATE_KEY as `0x${string}`,
);
export const TEST_APP_MANAGER_VIEM_WALLET_CLIENT = createWalletClient({
  account: TEST_APP_MANAGER_VIEM_ACCOUNT,
  chain: DATIL_CHAIN,
  transport: http(YELLOWSTONE_RPC_URL),
});

export const TEST_APP_DELEGATEE_PRIVATE_KEY = getEnv('TEST_APP_DELEGATEE_PRIVATE_KEY');
export const TEST_APP_DELEGATEE_ACCOUNT = privateKeyToAccount(
  TEST_APP_DELEGATEE_PRIVATE_KEY as `0x${string}`,
);

export const APP_NAME = 'Vincent Test App';
export const APP_DESCRIPTION = 'A test app for the Vincent protocol';
export const AUTHORIZED_REDIRECT_URIS = ['https://testing.vincent.com'];
export const DELEGATEES = [TEST_APP_DELEGATEE_ACCOUNT.address];
