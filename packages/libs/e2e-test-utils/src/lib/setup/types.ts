import type { Address, Chain, PrivateKeyAccount, PublicClient } from 'viem';
import type { Wallet } from 'ethers';

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
 * Smart account information with kernel account
 */
export interface SmartAccountInfo {
  smartAccountAddress: Address;
  deploymentTxHash?: `0x${string}`;
}

interface FundingConfig {
  funder?: {
    minAmountVincentRegistryChain?: bigint;
    minAmountChronicleYellowstone?: bigint;
  };
  appManagerMinAmount?: {
    minAmountVincentRegistryChain?: bigint;
  };
  userEoaMinAmount?: {
    minAmountVincentRegistryChain?: bigint;
  };
  appDelegateeMinAmount?: {
    minAmountChronicleYellowstone?: bigint;
  };
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
  smartAccountFundAmountBeforeDeployment?: bigint;
  sponsorGasForAppInstallation?: boolean;
  funding?: FundingConfig;
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
  accounts: {
    funder: PrivateKeyAccount;
    appManager: PrivateKeyAccount;
    appDelegatee: PrivateKeyAccount;
    userEoa: PrivateKeyAccount;
  };
  ethersWallets: {
    funder: Wallet;
    appManager: Wallet;
    appDelegatee: Wallet;
    userEoa: Wallet;
  };
  clients: {
    vincentRegistryPublicClient: PublicClient;
    chronicleYellowstonePublicClient: PublicClient;
  };
  agentSmartAccount: {
    address: Address;
    agentSignerAddress: Address;
    deploymentTxHash?: `0x${string}`;
    serializedPermissionAccount: string;
  };
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
