export { setupWallets } from './wallets/setupWallets';
export { setupVincentApp } from './app-setup';
export { setupAgentSmartAccount } from './setupAgentSmartAccount';
export { deploySmartAccountToChain } from './smart-account/deploySmartAccountToChain';
export { createPermissionApproval } from './smart-account/createPermissionApproval';
export { ensureWalletHasTokens } from './wallets/ensureWalletHasTokens';

export { getEnv } from './getEnv';

export type { SetupConfig, VincentDevEnvironment, SmartAccountInfo } from './types';
