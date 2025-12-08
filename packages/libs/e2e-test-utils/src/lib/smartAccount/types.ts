import type { CreateKernelAccountReturnType } from '@zerodev/sdk';
import type { WalletsApiClient } from '@crossmint/wallets-sdk';

export interface ZerodevSmartAccountInfo {
  account: CreateKernelAccountReturnType;
  serializedPermissionAccount: string;
}

export interface CrossmintSmartAccountInfo {
  account: Exclude<Awaited<ReturnType<WalletsApiClient['createWallet']>>, { error: any }>;
}

export type SmartAccountInfo = ZerodevSmartAccountInfo | CrossmintSmartAccountInfo;
