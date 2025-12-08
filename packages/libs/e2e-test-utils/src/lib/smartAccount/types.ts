import type { WalletsApiClient } from '@crossmint/wallets-sdk';
import type { CreateKernelAccountReturnType } from '@zerodev/sdk';

export interface ZerodevSmartAccountInfo {
  account: CreateKernelAccountReturnType;
  serializedPermissionAccount: string;
}

export interface CrossmintSmartAccountInfo {
  account: Exclude<Awaited<ReturnType<WalletsApiClient['createWallet']>>, { error: unknown }>;
}

export type SmartAccountInfo = ZerodevSmartAccountInfo | CrossmintSmartAccountInfo;
