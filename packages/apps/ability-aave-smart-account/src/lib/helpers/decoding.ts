import {
  type Abi,
  type Address,
  type Hex,
  decodeAbiParameters,
  decodeFunctionData,
  getAddress,
  hexToBigInt,
  isAddressEqual,
  sliceHex,
} from 'viem';

import { AAVE_POOL_ABI, FEE_CONTRACT_ABI } from './aave';
import { ERC20_ABI } from './erc20';
import { Transaction } from './transaction';
import { UserOp } from './userOperation';

type LowLevelCall = { to: Address; value: bigint; data: Hex };

// A big unified ABI of different smart account implementations
const smartAccountsAbi: Abi = [
  // Kernel v3.3/v3.1/v3.0
  {
    type: 'function',
    name: 'execute',
    inputs: [
      { name: 'execMode', type: 'bytes32', internalType: 'ExecMode' },
      { name: 'executionCalldata', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'executeFromExecutor',
    inputs: [
      { name: 'execMode', type: 'bytes32', internalType: 'ExecMode' },
      { name: 'executionCalldata', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [{ name: 'returnData', type: 'bytes[]', internalType: 'bytes[]' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'executeUserOp',
    inputs: [
      {
        name: 'userOp',
        type: 'tuple',
        internalType: 'struct PackedUserOperation',
        components: [
          {
            name: 'sender',
            type: 'address',
            internalType: 'address',
          },
          { name: 'nonce', type: 'uint256', internalType: 'uint256' },
          { name: 'initCode', type: 'bytes', internalType: 'bytes' },
          { name: 'callData', type: 'bytes', internalType: 'bytes' },
          {
            name: 'accountGasLimits',
            type: 'bytes32',
            internalType: 'bytes32',
          },
          {
            name: 'preVerificationGas',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'gasFees',
            type: 'bytes32',
            internalType: 'bytes32',
          },
          {
            name: 'paymasterAndData',
            type: 'bytes',
            internalType: 'bytes',
          },
          { name: 'signature', type: 'bytes', internalType: 'bytes' },
        ],
      },
      { name: 'userOpHash', type: 'bytes32', internalType: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
];

function isDelegatecallOrUnknown(execMode: Hex): boolean {
  const lastByte = BigInt(execMode) & 0xffn;
  return lastByte !== 0n; // 0x00 == CALL; others => block
}

function tryDecodeExecute(executionCalldata: Hex): LowLevelCall[] | null {
  // Because Execute with a single call is just a hex concatenation of the calldata,
  // this function might produce invalid decoding. It MUST be called last, only if
  // all other, stricter, decodings failed or if we know the calldata is a single call.
  // Also, the current implementation does not support delegate calls. It will produce
  // an invalid decoding for them.
  try {
    const hex = executionCalldata.slice(2);
    const MIN = 20 * 2 + 32 * 2; // address + value
    if (hex.length < MIN) return null;

    const to = getAddress(sliceHex(executionCalldata, 0, 20));
    const value = hexToBigInt(sliceHex(executionCalldata, 20, 52));
    const data = sliceHex(executionCalldata, 52);

    return [
      {
        data,
        to,
        value,
      },
    ];
  } catch (e) {
    console.error('tryDecodeExecute', e);
    return null;
  }
}

function tryDecodeBatchWithValues(executionCalldata: Hex): LowLevelCall[] | null {
  try {
    const [tuples] = decodeAbiParameters(
      [
        {
          name: 'executionBatch',
          type: 'tuple[]',
          components: [
            {
              name: 'target',
              type: 'address',
            },
            {
              name: 'value',
              type: 'uint256',
            },
            {
              name: 'callData',
              type: 'bytes',
            },
          ],
        },
      ],
      executionCalldata,
    );
    if (!tuples.length) return null;
    return tuples.map((t) => ({
      to: getAddress(t.target),
      value: t.value,
      data: t.callData,
    }));
  } catch (e) {
    console.error('tryDecodeBatchWithValues', e);
    return null;
  }
}

function decodeUserOpCalldataToLowLevelCalls(callData: Hex): LowLevelCall[] {
  const df = decodeFunctionData({ abi: smartAccountsAbi, data: callData });
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
    tryDecodeBatchWithValues,
    tryDecodeExecute,
  ];

  for (const dec of shapes) {
    const res = dec(executionCalldata);
    if (res) return res;
  }

  throw new Error('Unsupported Kernel v3.3 executionCalldata shape');
}

interface DecodeAaveOrERC20Result {
  kind: 'aave' | 'erc20_approval' | 'fee_contract';
  fn: string;
  args: readonly unknown[] | undefined;
  // For fee contract calls, track the mapped Aave operation (supply/withdraw) to apply appropriate validation rules,
  // since fee contract functions route to these underlying Aave operations. This enables the validation flow to
  // correctly enforce policy checks as if the user had called the Aave operation directly.
  mappedAaveOperation?: 'supply' | 'withdraw';
}

interface DecodeAaveOrERC20Failure {
  kind: 'blocked';
  reason: string;
}

// --------------- Decode Aave + ERC20 + Fee Contract and verify policy -------------------
function decodeAaveOrERC20(
  call: LowLevelCall,
  aavePoolAddress: Address,
  feeContractAddress: Address | null,
): DecodeAaveOrERC20Result | DecodeAaveOrERC20Failure {
  // Try Fee Contract first (for supply/withdraw operations)
  if (feeContractAddress && isAddressEqual(call.to, feeContractAddress)) {
    try {
      const df = decodeFunctionData({ abi: FEE_CONTRACT_ABI, data: call.data });
      if (df.functionName === 'depositToAave') {
        // depositToAave maps to Aave supply operation
        return {
          kind: 'fee_contract',
          fn: df.functionName,
          args: df.args,
          mappedAaveOperation: 'supply',
        } as const;
      } else if (df.functionName === 'withdrawFromAave') {
        // withdrawFromAave maps to Aave withdraw operation
        return {
          kind: 'fee_contract',
          fn: df.functionName,
          args: df.args,
          mappedAaveOperation: 'withdraw',
        } as const;
      } else {
        return {
          kind: 'blocked',
          reason: `Fee contract function not allowed: ${df.functionName}`,
        } as const;
      }
    } catch {
      return { kind: 'blocked', reason: 'Call to fee contract with unknown function' } as const;
    }
  }

  // Try Aave Pool (for borrow/repay/setUserUseReserveAsCollateral operations)
  if (isAddressEqual(call.to, aavePoolAddress)) {
    try {
      const df = decodeFunctionData({ abi: AAVE_POOL_ABI, data: call.data });
      // Only allow borrow, repay, and setUserUseReserveAsCollateral to go directly to Aave
      // supply and withdraw should go through fee contract
      if (df.functionName === 'supply' || df.functionName === 'withdraw') {
        // Check if fee contract is available for this chain
        if (!feeContractAddress) {
          return {
            kind: 'blocked',
            reason:
              'Aave not supported on this chain yet, please reach out to Lit Protocol to add support',
          } as const;
        }
        return {
          kind: 'blocked',
          reason: `${df.functionName} must go through fee contract, not directly to Aave`,
        } as const;
      }
      return { kind: 'aave', fn: df.functionName, args: df.args } as const;
    } catch {
      return { kind: 'blocked', reason: 'Call to POOL with unknown function' } as const;
    }
  }

  // Try ERC20 approve-ish (spender must equal POOL or fee contract)
  try {
    const df = decodeFunctionData({ abi: ERC20_ABI, data: call.data });
    if (df.functionName === 'approve' || df.functionName === 'increaseAllowance') {
      const [spender] = df.args as [Address, bigint];
      const allowedSpenders = [aavePoolAddress];
      if (feeContractAddress) {
        allowedSpenders.push(feeContractAddress);
      }
      if (!allowedSpenders.some((addr) => isAddressEqual(addr, spender))) {
        return {
          kind: 'blocked',
          reason: `ERC20 approval to non-allowed spender ${spender}`,
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
  feeContractAddress: Address | null;
  userOp: UserOp;
}

export interface DecodeUserOpResult {
  ok: boolean;
  reasons: string[];
}

const evaluateCallAgainstPolicy = ({
  aavePoolAddress,
  feeContractAddress,
  call,
  sender,
}: {
  aavePoolAddress: Address;
  feeContractAddress: Address | null;
  call: LowLevelCall;
  sender: Address;
}) => {
  const reasons: string[] = [];
  const res = decodeAaveOrERC20(call, aavePoolAddress, feeContractAddress);
  if (res.kind === 'blocked') {
    reasons.push(res.reason);
    return reasons;
  }

  if (res.kind === 'fee_contract') {
    const fn = res.fn;
    const mappedOp = res.mappedAaveOperation;

    if (fn === 'depositToAave' && mappedOp === 'supply') {
      // depositToAave(uint40 appId, address poolAsset, uint256 assetAmount)
      // The fee contract will handle the supply to the sender, so we just need to verify
      // that the caller is the sender (which is implicit in msg.sender)
      // No additional validation needed as the fee contract handles the routing
    } else if (fn === 'withdrawFromAave' && mappedOp === 'withdraw') {
      // withdrawFromAave(uint40 appId, address poolAsset, uint256 amount)
      // The fee contract will handle the withdrawal to the sender, so we just need to verify
      // that the caller is the sender (which is implicit in msg.sender)
      // No additional validation needed as the fee contract handles the routing
    } else {
      reasons.push(`Fee contract function not properly mapped: ${fn}`);
    }
  } else if (res.kind === 'aave') {
    const fn = res.fn;
    const args = res.args as any[];

    // Only borrow, repay, and setUserUseReserveAsCollateral should reach here
    // (supply/withdraw are blocked from direct Aave calls)
    if (fn === 'borrow') {
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
  feeContractAddress,
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
        feeContractAddress,
        call,
        sender,
      }),
    );
  }

  return { ok: reasons.length === 0, reasons };
};

interface DecodeTransactionParams {
  aavePoolAddress: Address;
  feeContractAddress: Address | null;
  transaction: Transaction;
}

export const decodeTransaction = ({
  aavePoolAddress,
  feeContractAddress,
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
    feeContractAddress,
    call,
    sender,
  });

  return { ok: reasons.length === 0, reasons };
};
