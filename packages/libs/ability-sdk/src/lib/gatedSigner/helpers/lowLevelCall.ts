import type { Address, Hex } from 'viem';

import type { UserOp } from './userOperation';

import { tryDecodeKernelCalldataToLowLevelCalls } from './smartAccounts/kernel';
import { tryDecodeSafeCalldataToLowLevelCalls } from './smartAccounts/safe';

export interface LowLevelCall {
  to: Address;
  value: bigint;
  data: Hex;
}

export interface DecodedFunctionCall<Args = unknown[] | null> {
  functionName: string;
  args: Args;
}

export const getUserOpCalls = (userOp: UserOp): LowLevelCall[] => {
  const callData = userOp.callData;

  const kernelCalls = tryDecodeKernelCalldataToLowLevelCalls(callData);
  const safeCalls = tryDecodeSafeCalldataToLowLevelCalls(callData);

  const decodedLowLevelCalls = [kernelCalls, safeCalls].filter(
    Boolean,
  ) as unknown as LowLevelCall[][];
  if (decodedLowLevelCalls.length > 1) {
    throw new Error('Multiple decodings found');
  } else if (!decodedLowLevelCalls.length) {
    throw new Error('Unsupported callData shape');
  }

  // Length is 1, we are good
  return decodedLowLevelCalls[0];
};
