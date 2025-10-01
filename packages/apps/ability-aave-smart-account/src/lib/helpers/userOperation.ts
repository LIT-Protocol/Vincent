import { ethers } from 'ethers';
import { z } from 'zod';

import { LIGHT_ACCOUNT_INIT_CODE } from './lightAccount';
import { SimulateUserOperationAssetChangesResponse } from './simulation';

const userOpBaseSchema = z.object({
  sender: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/)
    .describe('The account making the operation'),
  nonce: z
    .string()
    .regex(/^0x([1-9a-f]+[0-9a-f]*|0)$/)
    .optional()
    .describe('Account nonce or creation salt'),
  callData: z
    .string()
    .regex(/^0x[0-9a-f]*$/)
    .describe('Data for operation call'),
  callGasLimit: z
    .string()
    .regex(/^0x([1-9a-f]+[0-9a-f]{0,15})|0$/)
    .optional()
    .describe('Gas allocated for call'),
  verificationGasLimit: z
    .string()
    .regex(/^0x([1-9a-f]+[0-9a-f]{0,15})|0$/)
    .optional()
    .describe('Gas allocated for verification'),
  preVerificationGas: z
    .string()
    .regex(/^0x([1-9a-f]+[0-9a-f]{0,15})|0$/)
    .optional()
    .describe('Gas for pre-verification execution and calldata'),
  maxFeePerGas: z
    .string()
    .regex(/^0x([1-9a-f]+[0-9a-f]{0,15})|0$/)
    .optional()
    .default('0x59682F00') // 1.5 gwei (adjust to network conditions)
    .describe('Maximum fee per gas (EIP-1559)'),
  maxPriorityFeePerGas: z
    .string()
    .regex(/^0x([1-9a-f]+[0-9a-f]{0,15})|0$/)
    .optional()
    .default('0x3B9ACA00') // 1 gwei
    .describe('Max priority fee per gas (EIP-1559)'),
  signature: z
    .string()
    .regex(/^0x[0-9a-fA-F]*$/)
    .optional()
    .describe('Data passed during verification.'),
  eip7702Auth: z
    .object({
      chain_id: z
        .string()
        .regex(/^0x([1-9a-f]+[0-9a-f]{0,15})|0$/)
        .optional()
        .describe('The chain Id of the authorization'),
      address: z
        .string()
        .regex(/^0x[0-9a-fA-F]{40}$/)
        .optional()
        .describe('The address of the authorization'),
      nonce: z
        .string()
        .regex(/^0x([1-9a-f]+[0-9a-f]{0,15})|0$/)
        .optional()
        .describe('The nonce for the authorization'),
      y_parity: z
        .string()
        .regex(/^0x([1-9a-f]+[0-9a-f]*|0)$/)
        .optional()
        .describe('Y parity of signed authorization tuple'),
      r: z
        .string()
        .regex(/^0x([1-9a-f]+[0-9a-f]{0,31})|0$/)
        .optional()
        .describe('R of signed authorization tuple'),
      s: z
        .string()
        .regex(/^0x([1-9a-f]+[0-9a-f]{0,31})|0$/)
        .optional()
        .describe('S of signed authorization tuple'),
    })
    .optional(),
});

export const userOpv060Schema = userOpBaseSchema.extend({
  initCode: z
    .string()
    .regex(/^0x[0-9a-f]*$/)
    .default('0x')
    .describe(
      'The initCode of the account (needed if the account is not yet on-chain and needs creation)',
    ),
  paymasterAndData: z
    .string()
    .regex(/^0x[0-9a-f]*$/)
    .optional()
    .default('0x')
    .describe('Paymaster address and extra data'),
});

export type UserOpv060 = z.infer<typeof userOpv060Schema>;

export const userOpv070Schema = userOpBaseSchema.extend({
  paymaster: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/)
    .optional()
    .describe('Paymaster contract address'),
  paymasterData: z
    .string()
    .regex(/^0x[0-9a-f]*$/)
    .optional()
    .describe('Data for paymaster'),
  paymasterVerificationGasLimit: z
    .string()
    .regex(/^0x([1-9a-f]+[0-9a-f]{0,15})|0$/)
    .optional()
    .describe('The gas limit for paymaster verification.'),
  factory: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/)
    .optional()
    .describe(
      'The account factory address (needed if and only if the account is not yet on-chain and needs to be created)',
    ),
  factoryData: z
    .string()
    .regex(/^0x[0-9a-f]*$/)
    .optional()
    .describe('Data for the account factory (only if the account factory exists)'),
  paymasterPostOpGasLimit: z
    .string()
    .regex(/^0x([1-9a-f]+[0-9a-f]{0,15})|0$/)
    .optional()
    .describe(
      'The amount of gas to allocate for the paymaster post-op code (only if a paymaster exists)',
    ),
});

export type UserOpv070 = z.infer<typeof userOpv070Schema>;

export const userOpSchema = z.union([userOpv060Schema, userOpv070Schema]);
export type UserOp = z.infer<typeof userOpSchema>;

export const getUserOpVersion = (userOp: UserOp) => {
  if ('paymaster' in userOp) {
    return '0.7.0';
  } else {
    return '0.6.0';
  }
};

export const estimateUserOperationGas = async ({
  entryPointAddress,
  provider,
  userOp,
}: {
  entryPointAddress: string;
  provider: ethers.providers.JsonRpcProvider;
  userOp: UserOp;
}) => {
  return await provider.send('eth_estimateUserOperationGas', [userOp, entryPointAddress]);
};

export const getUserOpInitCode = async ({
  accountAddress,
  provider,
}: {
  accountAddress: string;
  provider: ethers.providers.JsonRpcProvider;
}) => {
  // Use smart account code or default initCode if it is not yet deployed
  const saCode = await provider.getCode(accountAddress);
  return saCode && saCode !== '0x' ? '0x' : LIGHT_ACCOUNT_INIT_CODE;
};

export const simulateUserOp = async ({
  entryPoint,
  provider,
  userOp,
}: {
  entryPoint: string;
  provider: ethers.providers.JsonRpcProvider;
  userOp: UserOp;
}) => {
  // Simulate UserOperation https://www.alchemy.com/docs/wallets/api-reference/bundler-api/useroperation-simulation-endpoints/alchemy-simulate-user-operation-asset-changes
  return (await provider.send('alchemy_simulateUserOperationAssetChanges', [
    userOp,
    entryPoint,
  ])) as SimulateUserOperationAssetChangesResponse;
};
