import type { SetupConfig, VincentDevEnvironment } from './setup/types';
import { setupWallets, setupVincentApp, setupUserSmartAccount } from './setup';
import { parseEther } from 'viem';

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

  // Phase 3: Setup user smart account (PKP minting, installation, deployment)
  const userAccountInfo = await setupUserSmartAccount({
    vincentRegistryRpcUrl: config.vincentRegistryRpcUrl,
    vincentApiUrl: config.vincentApiUrl,
    vincentRegistryChain: config.vincentRegistryChain,
    zerodevProjectId: config.zerodevProjectId,
    userEoaPrivateKey: config.privateKeys.userEoa,
    vincentAppId: appInfo.appId,
    funderPrivateKey: config.privateKeys.funder,
    // Assume the user is deploying to Base Sepolia, and 0.005 ETH is enough for smart account deployment
    fundAmountBeforeDeployment:
      config.smartAccountFundAmountBeforeDeployment ?? parseEther('0.005'),
  });

  console.log('=== Vincent Development Environment Setup Complete ===');

  return {
    vincentRegistryRpcUrl: config.vincentRegistryRpcUrl,
    vincentRegistryChain: config.vincentRegistryChain,
    appId: appInfo.appId,
    appVersion: appInfo.appVersion,
    accountIndexHash: appInfo.accountIndexHash,
    agentSignerAddress: userAccountInfo.pkpSignerAddress,
    agentSmartAccountAddress: userAccountInfo.agentSmartAccountAddress,
    smartAccountRegistrationTxHash: userAccountInfo.deploymentTxHash,
    accounts,
    ethersWallets,
    clients,
    smartAccount: userAccountInfo.smartAccount,
  };
}
