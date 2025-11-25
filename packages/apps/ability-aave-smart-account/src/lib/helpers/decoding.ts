import {
  type Address,
  type Hex,
  decodeFunctionData,
  getAddress,
  hexToBigInt,
  isAddressEqual,
} from 'viem';

import { AAVE_POOL_ABI } from './aave';
import { ERC20_ABI } from './erc20';
import { type LowLevelCall } from './lowLevelCall';
import { tryDecodeKernelCalldataToLowLevelCalls } from './smartAccounts/kernel';
import { tryDecodeSafeCalldataToLowLevelCalls } from './smartAccounts/safe';
import { Transaction } from './transaction';
import { UserOp } from './userOperation';

function decodeUserOpCalldataToLowLevelCalls(callData: Hex): LowLevelCall[] {
  const kernelCalls = tryDecodeKernelCalldataToLowLevelCalls(callData);
  const safeCalls = tryDecodeSafeCalldataToLowLevelCalls(callData);

  const decodedLowLevelCalls = [kernelCalls, safeCalls].filter(
    Boolean,
  ) as unknown as LowLevelCall[][];
  if (decodedLowLevelCalls.length > 1) {
    throw new Error('Multiple decodings found');
  } else if (!decodedLowLevelCalls.length) {
    throw new Error('Unsupported executionCalldata shape');
  }

  // Length is 1, we are good
  return decodedLowLevelCalls[0];
}

interface DecodeAaveOrERC20Result {
  kind: 'aave' | 'erc20_approval';
  fn: string;
  args: readonly unknown[] | undefined;
}

interface DecodeAaveOrERC20Failure {
  kind: 'blocked';
  reason: string;
}

// --------------- Decode Aave + ERC20 and verify policy -------------------
function decodeAaveOrERC20(
  call: LowLevelCall,
  aavePoolAddress: Address,
): DecodeAaveOrERC20Result | DecodeAaveOrERC20Failure {
  // Try Aave Pool
  if (isAddressEqual(call.to, aavePoolAddress)) {
    try {
      const df = decodeFunctionData({ abi: AAVE_POOL_ABI, data: call.data });
      return { kind: 'aave', fn: df.functionName, args: df.args } as const;
    } catch {
      return { kind: 'blocked', reason: 'Call to POOL with unknown function' } as const;
    }
  }

  // Try ERC20 approve-ish (spender must equal POOL)
  try {
    const df = decodeFunctionData({ abi: ERC20_ABI, data: call.data });
    if (df.functionName === 'approve' || df.functionName === 'increaseAllowance') {
      const [spender] = df.args as [Address, bigint];
      if (!isAddressEqual(spender, aavePoolAddress)) {
        return {
          kind: 'blocked',
          reason: `ERC20 approval to non-POOL spender ${spender}`,
        } as const;
      }
      return { kind: 'erc20_approval', fn: df.functionName, args: df.args } as const;
    }
  } catch {
    // not ERC20, keep checking
  }

  // Anything else is not allowed by policy
  return { kind: 'blocked', reason: `Target not in allowlist: ${call.to}` } as const;
}

export type ValidationResult = {
  ok: boolean;
  reasons: string[];
};

interface DecodeUserOpParams {
  aavePoolAddress: Address;
  userOp: UserOp;
}

export interface DecodeUserOpResult {
  ok: boolean;
  reasons: string[];
}

const evaluateCallAgainstPolicy = ({
  aavePoolAddress,
  call,
  sender,
}: {
  aavePoolAddress: Address;
  call: LowLevelCall;
  sender: Address;
}) => {
  const reasons: string[] = [];
  const res = decodeAaveOrERC20(call, aavePoolAddress);
  if (res.kind === 'blocked') {
    reasons.push(res.reason);
    return reasons;
  }

  if (res.kind === 'aave') {
    const fn = res.fn;
    const args = res.args as any[];

    if (fn === 'supply') {
      const onBehalfOf = getAddress(args[2]);
      if (!isAddressEqual(onBehalfOf, sender)) reasons.push('supply.onBehalfOf != sender');
    } else if (fn === 'withdraw') {
      const to = getAddress(args[2]);
      if (!isAddressEqual(to, sender)) reasons.push('withdraw.to != sender');
    } else if (fn === 'borrow') {
      const onBehalfOf = getAddress(args[4]);
      if (!isAddressEqual(onBehalfOf, sender)) reasons.push('borrow.onBehalfOf != sender');
    } else if (fn === 'repay') {
      const onBehalfOf = getAddress(args[3]);
      if (!isAddressEqual(onBehalfOf, sender)) reasons.push('repay.onBehalfOf != sender');
    } else if (fn === 'setUserUseReserveAsCollateral') {
      // ok; self-scoped setting
    } else {
      reasons.push(`Aave Pool function not allowed: ${fn}`);
    }
  }

  if (res.kind === 'erc20_approval') {
    // Block infinite approvals
    const amount = res.args?.[1] as bigint;
    if (amount === 2n ** 256n - 1n) reasons.push('Infinite approval not allowed');
  }

  return reasons;
};

export const decodeUserOp = async ({
  aavePoolAddress,
  userOp,
}: DecodeUserOpParams): Promise<DecodeUserOpResult> => {
  const reasons: string[] = [];
  const sender = getAddress(userOp.sender);

  // Normalize account calls
  let calls: LowLevelCall[];
  try {
    calls = decodeUserOpCalldataToLowLevelCalls(userOp.callData);
  } catch (e: any) {
    return { ok: false, reasons: [`Cannot decode account callData: ${e.message}`] };
  }

  // Enforce per-call policy
  for (const call of calls) {
    reasons.push(
      ...evaluateCallAgainstPolicy({
        aavePoolAddress,
        call,
        sender,
      }),
    );
  }

  return { ok: reasons.length === 0, reasons };
};

interface DecodeTransactionParams {
  aavePoolAddress: Address;
  transaction: Transaction;
}

export const decodeTransaction = ({
  aavePoolAddress,
  transaction,
}: DecodeTransactionParams): DecodeUserOpResult => {
  const sender = getAddress(transaction.from);
  const call: LowLevelCall = {
    data: transaction.data,
    to: getAddress(transaction.to),
    value: hexToBigInt(transaction.value),
  };

  const reasons = evaluateCallAgainstPolicy({
    aavePoolAddress,
    call,
    sender,
  });

  return { ok: reasons.length === 0, reasons };
};
