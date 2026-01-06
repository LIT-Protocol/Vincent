import type { WalletsApiClient } from '@crossmint/wallets-sdk';
import type { CreateKernelAccountReturnType } from '@zerodev/sdk';
import type { SmartAccountClient } from 'permissionless';
import type { toSafeSmartAccount } from 'permissionless/accounts';
import type { Address, Chain } from 'viem';
import type { PrivateKeyAccount } from 'viem/accounts';

export interface SetupSmartAccountParams {
  ownerAccount: PrivateKeyAccount;
  permittedAddress: Address;
  chain: Chain;
}

export interface ZerodevSmartAccountInfo {
  account: CreateKernelAccountReturnType;
  serializedPermissionAccount: string;
}

export interface CrossmintSmartAccountInfo {
  account: Exclude<Awaited<ReturnType<WalletsApiClient['createWallet']>>, { error: unknown }>;
  client: WalletsApiClient;
}

export interface SafeSmartAccountInfo {
  account: Awaited<ReturnType<typeof toSafeSmartAccount>>;
  client: SmartAccountClient;
}

export type SmartAccountInfo =
  | ZerodevSmartAccountInfo
  | CrossmintSmartAccountInfo
  | SafeSmartAccountInfo;
