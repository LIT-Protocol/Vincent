import type { Address } from 'viem';

export interface SmartAccountInfo {
  address: Address;
  serializedPermissionAccount: string;
}
