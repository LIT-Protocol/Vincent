import type { Chain, PrivateKeyAccount, PublicClient } from 'viem';

/**
 * App metadata for Vincent registry
 */
export interface AppMetadata {
  name: string;
  description: string;
  contactEmail: string;
  appUrl: string;
  logo?: string;
  deploymentStatus?: 'dev' | 'test' | 'prod';
}

/**
 * Smart account information with kernel account and approval signature
 */
export interface SmartAccountInfo {
  /** The kernel account instance */
  account: any; // KernelSmartAccount type from @zerodev/sdk
  /** The kernel account client for sending UserOperations via bundler */
  client: any; // KernelAccountClient type from @zerodev/sdk
  /** Public client for reading blockchain state */
  publicClient: any; // PublicClient from viem
  /** Wallet client for the user's EOA (can be used to deploy the smart account) */
  walletClient: any; // WalletClient from viem
  /** Serialized permission approval for the session key */
  approval: string;
}

/**
 * Configuration for the development environment setup
 */
export interface SetupConfig {
  vincentRegistryRpcUrl: string;
  vincentRegistryChain: Chain;
  vincentApiUrl: string;
  privateKeys: {
    appManager: `0x${string}`;
    appDelegatee: `0x${string}`;
    userEoa: `0x${string}`;
    funder: `0x${string}`;
  };
  appMetadata: AppMetadata;
  abilityIpfsCids: string[];
  abilityPolicies: string[][];
  zerodevProjectId: string;
}

/**
 * Result type for the development environment setup
 */
export interface VincentDevEnvironment {
  vincentRegistryRpcUrl: string;
  vincentRegistryChain: Chain;
  appId: number;
  appVersion: number;
  accountIndexHash?: string;
  agentSignerAddress: string;
  agentSmartAccountAddress: string;
  smartAccountRegistrationTxHash?: string;
  accounts: {
    funder: PrivateKeyAccount;
    appManager: PrivateKeyAccount;
    appDelegatee: PrivateKeyAccount;
    userEoa: PrivateKeyAccount;
  };
  clients: {
    vincentRegistryPublicClient: PublicClient;
    chronicleYellowstonePublicClient: PublicClient;
  };
  smartAccount: SmartAccountInfo;
}

/**
 * Result from on-chain app registration
 */
export interface RegisterAppResult {
  hash: string;
  appId: bigint;
  accountIndexHash: string;
  appVersion: bigint;
}
