import { KernelV3_3AccountAbi } from '@zerodev/sdk';
import {
  Address,
  Hex,
  decodeAbiParameters,
  decodeFunctionData,
  getAddress,
  isAddressEqual,
} from 'viem';

import { AAVE_POOL_ABI } from './aave';
import { ERC20_ABI } from './erc20';
import { UserOp } from './userOperation';

type LowLevelCall = { to: Address; value: bigint; data: Hex };

function isDelegatecallOrUnknown(execMode: Hex): boolean {
  const lastByte = BigInt(execMode) & 0xffn;
  return lastByte !== 0n; // 0x00 == CALL; others => block
}

function tryDecodeSingle(executionCalldata: Hex): LowLevelCall[] | null {
  // Try standard ABI first (works if someone encoded tuple-ABI style)
  try {
    const [to, value, data] = decodeAbiParameters(
      [
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' },
      ],
      executionCalldata,
    );
    return [{ to: getAddress(to), value, data }];
  } catch {
    // Fallback: packed layout
    try {
      // must start with 0x and be long enough for 20 + 32 bytes
      if (!executionCalldata.startsWith('0x')) return null;
      const hex = executionCalldata.slice(2);
      const MIN = 20 * 2 + 32 * 2; // 40 + 64 nibbles
      if (hex.length < MIN) return null;

      // to: first 20 bytes (40 hex chars)
      const toHex = '0x' + hex.slice(0, 40);
      // value: next 32 bytes (64 hex chars) big-endian uint256
      const valueHex = '0x' + hex.slice(40, 40 + 64);
      // data: rest
      const dataHex = '0x' + hex.slice(40 + 64);

      const to = getAddress(toHex as Hex);
      const value = BigInt(valueHex as Hex);
      const data = dataHex as Hex;

      return [{ to, value, data }];
    } catch {
      return null;
    }
  }
}

function tryDecodeBatchNoValue(executionCalldata: Hex): LowLevelCall[] | null {
  try {
    const [tos, datas] = decodeAbiParameters(
      [
        { name: 'to', type: 'address[]' },
        { name: 'data', type: 'bytes[]' },
      ],
      executionCalldata,
    );
    if (tos.length !== datas.length) return null;
    return tos.map((t: Address, i: number) => ({
      to: getAddress(t),
      value: 0n,
      data: datas[i] as Hex,
    }));
  } catch {
    return null;
  }
}

function tryDecodeBatchWithValue(executionCalldata: Hex): LowLevelCall[] | null {
  try {
    const [tos, values, datas] = decodeAbiParameters(
      [
        { name: 'to', type: 'address[]' },
        { name: 'value', type: 'uint256[]' },
        { name: 'data', type: 'bytes[]' },
      ],
      executionCalldata,
    );
    if (tos.length !== datas.length || tos.length !== values.length) return null;
    return tos.map((t: Address, i: number) => ({
      to: getAddress(t),
      value: values[i] as bigint,
      data: datas[i] as Hex,
    }));
  } catch {
    return null;
  }
}

function tryDecodePackedSingles(executionCalldata: Hex): LowLevelCall[] | null {
  try {
    const [chunks] = decodeAbiParameters([{ name: 'calls', type: 'bytes[]' }], executionCalldata);
    const out: LowLevelCall[] = [];
    for (const ch of chunks as Hex[]) {
      const single = tryDecodeSingle(ch);
      if (!single) return null; // if any chunk isn’t single, abort this shape
      out.push(single[0]);
    }
    return out;
  } catch {
    return null;
  }
}

function decodeKernelV33ToCalls(callData: Hex): LowLevelCall[] {
  const df = decodeFunctionData({ abi: KernelV3_3AccountAbi, data: callData });
  if (df.functionName !== 'execute' && df.functionName !== 'executeFromExecutor') {
    throw new Error('Not a Kernel v3.3 execute/executor call');
  }

  const [execMode, executionCalldata] = df.args as [Hex, Hex];

  // BLOCK delegatecall/unknown modes up-front
  if (isDelegatecallOrUnknown(execMode)) {
    throw new Error(`Blocked by execMode (non-CALL): ${execMode}`);
  }

  // Try common inner shapes
  const shapes: ((ec: Hex) => LowLevelCall[] | null)[] = [
    tryDecodeSingle,
    tryDecodeBatchWithValue,
    tryDecodeBatchNoValue,
    tryDecodePackedSingles,
  ];

  for (const dec of shapes) {
    const res = dec(executionCalldata);
    if (res) return res;
  }

  throw new Error('Unsupported Kernel v3.3 executionCalldata shape');
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
  aaveATokens: Record<string, string>;
  aavePoolAddress: Address;
  entryPointAddress: Address;
  userOp: UserOp;
}

export interface DecodeUserOpResult {
  ok: boolean;
  reasons: string[];
}

export const decodeUserOp = async ({
  aavePoolAddress,
  userOp,
}: DecodeUserOpParams): Promise<DecodeUserOpResult> => {
  const reasons: string[] = [];
  const sender = getAddress(userOp.sender);

  // Normalize account calls
  let calls: LowLevelCall[];
  try {
    calls = decodeKernelV33ToCalls(userOp.callData);
  } catch (e: any) {
    return { ok: false, reasons: [`Cannot decode account callData: ${e.message}`] };
  }

  // Enforce per-call policy
  for (const call of calls) {
    const res = decodeAaveOrERC20(call, aavePoolAddress);
    if (res.kind === 'blocked') {
      reasons.push(res.reason);
      continue;
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
  }

  return { ok: reasons.length === 0, reasons };
};
