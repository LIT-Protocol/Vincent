import { type Address, type Hex } from 'viem';

export interface LowLevelCall {
  to: Address;
  value: bigint;
  data: Hex;
}

export interface DecodedFunctionCall<Args = unknown[] | null> {
  functionName: string;
  args: Args;
}
