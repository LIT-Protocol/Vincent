import type { Abi, Address, Hex } from 'viem';

import { decodeFunctionData, getAddress, hexToBigInt, hexToNumber, slice } from 'viem';

import type { Eip712Params } from '../eip712';
import type { DecodedFunctionCall, LowLevelCall } from '../lowLevelCall';

interface InternalTransaction {
  operation: number; // uint8 (0 = call, 1 = delegatecall)
  to: Address; // address
  value: bigint; // uint256
  data: Hex; // bytes
}

type SafeArgs = [Address, bigint, Hex, number];
type DecodedSafeFunction = DecodedFunctionCall<SafeArgs>;

const safeAccountsAbi: Abi = [
  {
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'uint8', type: 'uint8' },
    ],
    name: 'executeUserOp',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    type: 'function',
    name: 'executeUserOpWithErrorString',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'uint8', type: 'uint8' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
];

const multiSendAbi: Abi = [
  {
    inputs: [
      {
        internalType: 'bytes',
        name: 'transactions',
        type: 'bytes',
      },
    ],
    name: 'multiSend',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
];

/**
 * Decodes a stream of packed internal transactions.
 * Opposite of encodeInternalTransaction.
 * https://github.com/pimlicolabs/permissionless.js/blob/main/packages/permissionless/accounts/safe/toSafeSmartAccount.ts#L566
 * * Format:
 * [operation (1b)][to (20b)][value (32b)][dataLength (32b)][data (variable)]
 */
export function decodeInternalTransactions(data: Hex | string): InternalTransaction[] {
  // Ensure data is a valid Hex string with 0x prefix for viem utils
  const hex: Hex = data.startsWith('0x') ? (data as Hex) : `0x${data}`;

  // If empty, return empty array
  if (hex === '0x' || hex.length === 0) return [];

  const txs: InternalTransaction[] = [];
  let cursor = 0;
  const totalBytes = (hex.length - 2) / 2; // Calculate byte length from hex string

  while (cursor < totalBytes) {
    // 1. Decode Operation (uint8 = 1 byte)
    const opBytes = slice(hex, cursor, cursor + 1);
    const operation = hexToNumber(opBytes);
    cursor += 1;

    // 2. Decode To Address (address = 20 bytes)
    const toBytes = slice(hex, cursor, cursor + 20);
    const to = getAddress(toBytes); // Checksums the address
    cursor += 20;

    // 3. Decode Value (uint256 = 32 bytes)
    const valueBytes = slice(hex, cursor, cursor + 32);
    const value = hexToBigInt(valueBytes);
    cursor += 32;

    // 4. Decode Data Length (uint256 = 32 bytes)
    const lengthBytes = slice(hex, cursor, cursor + 32);
    const dataLength = hexToNumber(lengthBytes);
    cursor += 32;

    // 5. Decode Data (bytes = dynamic length)
    // Note: encodePacked simply appends the bytes, no padding
    const dataBytes = slice(hex, cursor, cursor + dataLength);
    cursor += dataLength;

    txs.push({
      operation,
      to,
      value,
      data: dataBytes,
    });
  }

  return txs;
}

function tryDecodeSafeMultiSendCalldata(df: DecodedSafeFunction): LowLevelCall[] | null {
  try {
    const { args } = decodeFunctionData({
      data: df.args[2],
      abi: multiSendAbi,
    });
    const [internalTxs] = (args || ['0x']) as [Hex];

    const decodedInternalTxs = decodeInternalTransactions(internalTxs);

    return decodedInternalTxs.map((t) => ({ data: t.data, to: t.to, value: t.value }));
  } catch (e) {
    console.error('tryDecodeSafeMultiSendCalldata', e);
    return null;
  }
}

function tryDecodeSafeSendCalldata(df: DecodedSafeFunction): LowLevelCall[] | null {
  try {
    const lowLevelCall: LowLevelCall = {
      data: df.args[2],
      to: df.args[0],
      value: df.args[1],
    };

    return [lowLevelCall];
  } catch (e) {
    console.error('tryDecodeSafeSendCalldata', e);
    return null;
  }
}

export function tryDecodeSafeCalldataToLowLevelCalls(callData: Hex): LowLevelCall[] | null {
  let df: DecodedSafeFunction;
  try {
    df = decodeFunctionData({ abi: safeAccountsAbi, data: callData }) as DecodedSafeFunction;
  } catch {
    console.log('Calldata is not a known Safe calldata. Continuing...');
    return null;
  }
  console.log('Decoded calldata for Safe smart account.');

  if (!['executeUserOp', 'executeUserOpWithErrorString'].includes(df.functionName)) {
    console.log('Not a known Safe execute/executor call');
    return null;
  }

  const safeShapes: ((df: DecodedSafeFunction) => LowLevelCall[] | null)[] = [
    tryDecodeSafeMultiSendCalldata,
    tryDecodeSafeSendCalldata,
  ];
  for (const dec of safeShapes) {
    const res = dec(df);
    if (res) return res;
  }

  return null;
}

export const safeEip712Params: Eip712Params = {
  domain: {
    chainId: '$chainId',
    verifyingContract: '$safe4337ModuleAddress',
  },
  types: {
    SafeOp: [
      { type: 'address', name: 'safe' },
      { type: 'uint256', name: 'nonce' },
      { type: 'bytes', name: 'initCode' },
      { type: 'bytes', name: 'callData' },
      { type: 'uint128', name: 'verificationGasLimit' },
      { type: 'uint128', name: 'callGasLimit' },
      { type: 'uint256', name: 'preVerificationGas' },
      { type: 'uint128', name: 'maxPriorityFeePerGas' },
      { type: 'uint128', name: 'maxFeePerGas' },
      { type: 'bytes', name: 'paymasterAndData' },
      { type: 'uint48', name: 'validAfter' },
      { type: 'uint48', name: 'validUntil' },
      { type: 'address', name: 'entryPoint' },
    ],
  },
  primaryType: 'SafeOp',
  message: {
    safe: '$userOp.sender',
    nonce: '$userOp.nonce',
    initCode: '$userOp.initCode',
    callData: '$userOp.callData',
    callGasLimit: '$userOp.callGasLimit',
    verificationGasLimit: '$userOp.verificationGasLimit',
    preVerificationGas: '$userOp.preVerificationGas',
    maxFeePerGas: '$userOp.maxFeePerGas',
    maxPriorityFeePerGas: '$userOp.maxPriorityFeePerGas',
    paymasterAndData: '$userOp.paymasterAndData',
    validAfter: '$validAfter',
    validUntil: '$validUntil',
    entryPoint: '$entryPointAddress',
  },
};
