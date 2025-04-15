import { createPublicClient, createWalletClient, defineChain, http } from "viem";

import { getEnv } from "./test-config";
import { privateKeyToAccount } from "viem/accounts";
import path from "path";

export const VINCENT_ADDRESS = getEnv('VINCENT_ADDRESS');
export const YELLOWSTONE_RPC_URL = getEnv('YELLOWSTONE_RPC_URL');
export const BASE_RPC_URL = getEnv('BASE_RPC_URL');

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

export const TEST_APP_MANAGER_PRIVATE_KEY = getEnv('TEST_APP_MANAGER_PRIVATE_KEY');
export const TEST_APP_MANAGER_VIEM_ACCOUNT = privateKeyToAccount(TEST_APP_MANAGER_PRIVATE_KEY as `0x${string}`);
export const TEST_APP_MANAGER_VIEM_WALLET_CLIENT = createWalletClient({
    account: TEST_APP_MANAGER_VIEM_ACCOUNT,
    chain: DATIL_CHAIN,
    transport: http(YELLOWSTONE_RPC_URL)
});

// Create public client for reading transaction receipts and logs
export const DATIL_PUBLIC_CLIENT = createPublicClient({
    chain: DATIL_CHAIN,
    transport: http(YELLOWSTONE_RPC_URL)
});

export const BASE_PUBLIC_CLIENT = createPublicClient({
    chain: BASE_CHAIN,
    transport: http(BASE_RPC_URL)
});

export const TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY = getEnv('TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY');
export const TEST_AGENT_WALLET_PKP_OWNER_VIEM_ACCOUNT = privateKeyToAccount(TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY as `0x${string}`);
export const TEST_AGENT_WALLET_PKP_OWNER_VIEM_WALLET_CLIENT = createWalletClient({
    account: TEST_AGENT_WALLET_PKP_OWNER_VIEM_ACCOUNT,
    chain: DATIL_CHAIN,
    transport: http(YELLOWSTONE_RPC_URL)
});

export const TEST_APP_DELEGATEE_PRIVATE_KEY = getEnv('TEST_APP_DELEGATEE_PRIVATE_KEY');
export const TEST_APP_DELEGATEE_ACCOUNT = privateKeyToAccount(TEST_APP_DELEGATEE_PRIVATE_KEY as `0x${string}`)
export const TEST_CONFIG_PATH = path.join(__dirname, '../test-config.json');

export const APP_NAME = 'Vincent Test App';
export const APP_DESCRIPTION = 'A test app for the Vincent protocol';
export const AUTHORIZED_REDIRECT_URIS = ['https://testing.vincent.com'];
export const DELEGATEES = [TEST_APP_DELEGATEE_ACCOUNT.address];

export const ERC20_APPROVAL_TOOL_IPFS_ID = getEnv('ERC20_APPROVAL_TOOL_IPFS_ID');
export const UNISWAP_SWAP_TOOL_IPFS_ID = getEnv('UNISWAP_SWAP_TOOL_IPFS_ID');
export const SPENDING_LIMIT_POLICY_IPFS_ID = getEnv('SPENDING_LIMIT_POLICY_IPFS_ID');

// Enums matching the contract definitions
export enum PARAMETER_TYPE {
    INT256 = 0,
    INT256_ARRAY = 1,
    UINT256 = 2,
    UINT256_ARRAY = 3,
    BOOL = 4,
    BOOL_ARRAY = 5,
    ADDRESS = 6,
    ADDRESS_ARRAY = 7,
    STRING = 8,
    STRING_ARRAY = 9,
    BYTES = 10,
    BYTES_ARRAY = 11
}

export enum DEPLOYMENT_STATUS {
    DEV = 0,
    TEST = 1,
    PROD = 2
}
