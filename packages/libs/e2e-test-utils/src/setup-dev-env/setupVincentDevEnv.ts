import type { Address, Chain, PrivateKeyAccount, PublicClient } from 'viem';
import type { Wallet } from 'ethers';

import { setupWallets } from './wallets/setupWallets';
import { setupVincentApp } from './setupVincentApp';
import { setupAgentSmartAccount } from './setupAgentSmartAccount';

export interface VincentDevEnvironment {
  vincentRegistryRpcUrl: string;
  vincentRegistryChain: Chain;
  smartAccountChainRpcUrl: string;
  smartAccountChain: Chain;
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
  agentSmartAccount?: {
    address: Address;
    agentSignerAddress: Address;
    deploymentTxHash?: string;
    serializedPermissionAccount?: string;
    permitAppVersionTxHash?: string;
  };
}

export interface AppMetadata {
  name: string;
  description: string;
  contactEmail: string;
  appUrl: string;
  logo?: string;
  deploymentStatus?: 'dev' | 'test' | 'prod';
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

export interface SetupConfig {
  vincentRegistryRpcUrl: string;
  vincentRegistryChain: Chain;
  smartAccountChainRpcUrl: string;
  smartAccountChain: Chain;
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
  funding?: FundingConfig;
  /**
   * If true, skips Phase 3 (agent smart account setup).
   * Use this when the smart account will be created later (e.g., via Privy in a frontend app).
   */
  skipSmartAccountSetup?: boolean;
}

export async function setupVincentDevelopmentEnvironment(
  config: SetupConfig,
): Promise<VincentDevEnvironment> {
  console.log('=== Setting up Vincent Development Environment ===');
  console.table({
    VINCENT_REGISTRY_NETWORK: config.vincentRegistryChain.name,
    VINCENT_REGISTRY_CHAIN_ID: config.vincentRegistryChain.id,
    VINCENT_REGISTRY_RPC_URL: config.vincentRegistryRpcUrl,
  });

  // Phase 1: Setup wallets and fund them
  const { accounts, ethersWallets, clients } = await setupWallets({
    privateKeys: config.privateKeys,
    vincentRegistryChain: config.vincentRegistryChain,
    vincentRegistryRpcUrl: config.vincentRegistryRpcUrl,
    funding: config.funding,
  });

  // Phase 2: Setup Vincent app (registration and API configuration)
  const appInfo = await setupVincentApp({
    vincentRegistryRpcUrl: config.vincentRegistryRpcUrl,
    vincentApiUrl: config.vincentApiUrl,
    appManagerPrivateKey: config.privateKeys.appManager,
    appDelegateePrivateKey: config.privateKeys.appDelegatee,
    appDelegatees: [accounts.appDelegatee.address],
    appMetadata: config.appMetadata,
    abilityIpfsCids: config.abilityIpfsCids,
    abilityPolicies: config.abilityPolicies,
  });

  // Phase 3: Setup user's agent smart account (sign typed data and complete installation)
  // Skip this phase if skipSmartAccountSetup is true (e.g., for apps using Privy)
  let agentSmartAccountInfo;
  if (!config.skipSmartAccountSetup) {
    agentSmartAccountInfo = await setupAgentSmartAccount({
      vincentRegistryRpcUrl: config.vincentRegistryRpcUrl,
      vincentApiUrl: config.vincentApiUrl,
      vincentRegistryChain: config.vincentRegistryChain,
      smartAccountChainRpcUrl: config.smartAccountChainRpcUrl,
      smartAccountChain: config.smartAccountChain,
      userEoaPrivateKey: config.privateKeys.userEoa,
      vincentAppId: appInfo.appId,
    });
  } else {
    console.log('Skipping agent smart account setup');
  }

  console.log('=== Vincent Development Environment Setup Complete ===');

  return {
    vincentRegistryRpcUrl: config.vincentRegistryRpcUrl,
    vincentRegistryChain: config.vincentRegistryChain,
    smartAccountChainRpcUrl: config.smartAccountChainRpcUrl,
    smartAccountChain: config.smartAccountChain,
    appId: appInfo.appId,
    appVersion: appInfo.appVersion,
    accountIndexHash: appInfo.accountIndexHash,
    accounts,
    ethersWallets,
    clients,
    agentSmartAccount: agentSmartAccountInfo
      ? {
          address: agentSmartAccountInfo.agentSmartAccountAddress,
          agentSignerAddress: agentSmartAccountInfo.agentSignerAddress,
          deploymentTxHash: agentSmartAccountInfo.deploymentTxHash,
          serializedPermissionAccount: agentSmartAccountInfo.serializedPermissionAccount,
          permitAppVersionTxHash: agentSmartAccountInfo.permitAppVersionTxHash,
        }
      : undefined,
  };
}
