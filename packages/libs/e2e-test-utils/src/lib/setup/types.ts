import type { Wallet } from 'ethers';
import type { Chain } from 'viem';

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
  /** Ability IPFS CIDs to register (e.g., relay.link ability) */
  abilityIpfsCids: string[];
  /** Policies for each ability (empty array for no policies) */
  abilityPolicies: string[][];
  /** RPC URL for the chain */
  rpcUrl: string;
  /** Chain to deploy on */
  chain: Chain;
  /** Vincent API URL for registration */
  vincentApiUrl: string;
  /** ZeroDev project ID for bundler operations (required for smart account deployment) */
  zerodevProjectId: string;
  /** App metadata */
  appMetadata: {
    name: string;
    description: string;
    contactEmail: string;
    appUrl: string;
    logo?: string;
    deploymentStatus?: 'dev' | 'test' | 'prod';
  };
  /** Private keys */
  privateKeys: {
    /** App manager private key (owns the app on-chain) */
    appManager: string;
    /** App delegatee private key (can execute on behalf of users) */
    appDelegatee: string;
    /** User EOA private key (owns the smart account) */
    userEoa: string;
    /** Funder private key (funds other wallets with test tokens) */
    funder: string;
  };
}

/**
 * Result type for the development environment setup
 */
export interface VincentDevEnvironment {
  /** The on-chain app ID */
  appId: number;
  /** The app version number */
  appVersion: number;
  /** Agent signer address (PKP address created by registry API, NOT an EOA) */
  agentSignerAddress: string;
  /** Agent smart account address (derived from user EOA) */
  agentSmartAccountAddress: string;
  /** User's EOA address (from private key) */
  userEoaAddress: string;
  /** Account index hash for deterministic address derivation */
  accountIndexHash: string;
  /** Transaction hash of the app registration */
  registrationTxHash: string;
  /** RPC URL for the chain */
  rpcUrl: string;
  /** Chain configuration */
  chain: Chain;
  /** Wallets used in the setup */
  wallets: {
    appManager: Wallet;
    appDelegatee: Wallet;
    userEoa: Wallet;
    funder: Wallet;
  };
  /** Local smart account client for interacting with the deployed smart account */
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
