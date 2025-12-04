import type { Abi, Hex } from 'viem';

import { decodeAbiParameters, decodeFunctionData, getAddress, hexToBigInt, sliceHex } from 'viem';

import type { DecodedFunctionCall, LowLevelCall } from '../lowLevelCall';

type KernelArgs = [Hex, Hex];
type DecodedKernelFunction = DecodedFunctionCall<KernelArgs>;

const kernelAccountsAbi: Abi = [
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

function tryDecodeKernelExecuteBatchCall(df: DecodedKernelFunction): LowLevelCall[] | null {
  try {
    // https://github.com/zerodevapp/sdk/blob/main/packages/core/accounts/kernel/utils/ep0_7/encodeExecuteBatchCall.ts
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
      df.args[1],
    );
    if (!tuples.length) return null;
    return tuples.map((t) => ({
      to: getAddress(t.target),
      value: t.value,
      data: t.callData,
    }));
  } catch (e) {
    console.error('tryDecodeKernelExecuteBatchCall', e);
    return null;
  }
}

function tryDecodeKernelExecuteCall(df: DecodedKernelFunction): LowLevelCall[] | null {
  // https://github.com/zerodevapp/sdk/blob/main/packages/core/accounts/kernel/utils/ep0_7/encodeExecuteSingleCall.ts
  // Because Execute with a single call is just a hex concatenation of the calldata,
  // this function might produce invalid decoding. It MUST be called last, only if
  // all other, stricter, decodings failed or if we know the calldata is a single call.
  // Also, the current implementation does not support delegate calls. It will produce
  // an invalid decoding for them.
  try {
    const data = df.args[1];
    const hex = data.slice(2);
    const MIN = 20 * 2 + 32 * 2; // address + value
    if (hex.length < MIN) return null;

    const to = getAddress(sliceHex(data, 0, 20));
    const value = hexToBigInt(sliceHex(data, 20, 52));
    const calldata = sliceHex(data, 52);

    return [
      {
        data: calldata,
        to,
        value,
      },
    ];
  } catch (e) {
    console.error('tryDecodeKernelExecuteCall', e);
    return null;
  }
}

function isDelegatecallOrUnknown(execMode: Hex): boolean {
  const lastByte = BigInt(execMode) & 0xffn;
  return lastByte !== 0n; // 0x00 == CALL; others => block
}

export function tryDecodeKernelCalldataToLowLevelCalls(callData: Hex): LowLevelCall[] | null {
  let df: DecodedKernelFunction;
  try {
    df = decodeFunctionData({ abi: kernelAccountsAbi, data: callData }) as DecodedKernelFunction;
  } catch {
    console.log('Calldata is not a known kernel calldata. Continuing...');
    return null;
  }

  if (!['execute', 'executeFromExecutor'].includes(df.functionName)) {
    console.log('Not a known Kernel execute/executor call');
    return null;
  }

  const [execMode] = df.args as [Hex, Hex];

  // BLOCK delegatecall/unknown modes up-front
  if (isDelegatecallOrUnknown(execMode)) {
    throw new Error(`Blocked by execMode (non-CALL): ${execMode}`);
  }

  // Try common inner shapes
  const shapes: ((df: DecodedKernelFunction) => LowLevelCall[] | null)[] = [
    tryDecodeKernelExecuteBatchCall,
    tryDecodeKernelExecuteCall,
  ];

  for (const dec of shapes) {
    const res = dec(df);
    if (res) return res;
  }

  return null;
}
