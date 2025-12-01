import type { CreateKernelAccountReturnType } from '@zerodev/sdk';

export interface SmartAccountInfo {
  account: CreateKernelAccountReturnType;
  serializedPermissionAccount: string;
}
