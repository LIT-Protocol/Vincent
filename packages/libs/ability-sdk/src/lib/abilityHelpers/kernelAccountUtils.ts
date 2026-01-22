import type { Address, Hex, PublicClient } from 'viem';
import { concat, encodeFunctionData, getAbiItem, pad, toFunctionSelector, zeroAddress } from 'viem';
import { readContract } from 'viem/actions';
import { KernelV3_3AccountAbi } from '@zerodev/sdk';
import { toPermissionValidator, deserializePermissionAccount } from '@zerodev/permissions';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { toSudoPolicy } from '@zerodev/permissions/policies';
import { addressToEmptyAccount } from '@zerodev/sdk';
import { getEntryPoint, KERNEL_V3_3, VALIDATOR_TYPE } from '@zerodev/sdk/constants';

export interface CreateKernelAccountWithValidatorsParams {
  publicClient: PublicClient;
  agentSignerAddress: Address;
  serializedPermissionAccount: string;
}

export interface CreateKernelAccountWithValidatorsResult {
  kernelAccount: Awaited<ReturnType<typeof deserializePermissionAccount>>;
  permissionValidator: Awaited<ReturnType<typeof toPermissionValidator>>;
}

export async function createKernelAccountWithValidators(
  params: CreateKernelAccountWithValidatorsParams,
): Promise<CreateKernelAccountWithValidatorsResult> {
  const { publicClient, agentSignerAddress, serializedPermissionAccount } = params;

  console.log('[@lit-protocol/vincent-ability-sdk] Deserializing permission account');

  const pkpECDSASigner = await toECDSASigner({
    signer: addressToEmptyAccount(agentSignerAddress),
  });

  const kernelAccount = await deserializePermissionAccount(
    publicClient,
    getEntryPoint('0.7'),
    KERNEL_V3_3,
    serializedPermissionAccount,
    pkpECDSASigner,
  );

  // Create the permission validator to use for checking if it's enabled and for installation
  const pkpPermissionValidator = await toPermissionValidator(publicClient, {
    entryPoint: getEntryPoint('0.7'),
    signer: pkpECDSASigner,
    policies: [toSudoPolicy({})],
    kernelVersion: KERNEL_V3_3,
  });

  return {
    kernelAccount,
    permissionValidator: pkpPermissionValidator,
  };
}

export interface GetValidatorInstallationCalldataParams {
  kernelAccountAddress: Address;
  permissionValidator: Awaited<ReturnType<typeof toPermissionValidator>>;
}

export async function getValidatorInstallationCalldata(
  params: GetValidatorInstallationCalldataParams,
): Promise<{ installValidationsCalldata: Hex; grantAccessCalldata: Hex }> {
  const { kernelAccountAddress, permissionValidator } = params;

  const permissionId = permissionValidator.getIdentifier();
  const enableData = await permissionValidator.getEnableData(kernelAccountAddress);

  const installValidationsCalldata = encodeFunctionData({
    abi: KernelV3_3AccountAbi,
    functionName: 'installValidations',
    args: [
      [pad(concat([VALIDATOR_TYPE.PERMISSION, permissionId]), { size: 21, dir: 'right' })],
      [{ nonce: 1, hook: zeroAddress }],
      [enableData],
      ['0x'],
    ],
  });

  const grantAccessCalldata = encodeFunctionData({
    abi: KernelV3_3AccountAbi,
    functionName: 'grantAccess',
    args: [
      pad(concat([VALIDATOR_TYPE.PERMISSION, permissionId]), { size: 21, dir: 'right' }),
      toFunctionSelector(getAbiItem({ abi: KernelV3_3AccountAbi, name: 'execute' })),
      true,
    ],
  });

  return { installValidationsCalldata, grantAccessCalldata };
}

export interface BundleValidatorInstallationWithTransactionParams {
  kernelAccount: Awaited<ReturnType<typeof deserializePermissionAccount>>;
  permissionValidator: Awaited<ReturnType<typeof toPermissionValidator>>;
  abilityTransaction: {
    to: Address;
    data: Hex;
    value: bigint | string;
  };
}

export async function bundleValidatorInstallationWithTransaction(
  params: BundleValidatorInstallationWithTransactionParams,
): Promise<Hex> {
  const { kernelAccount, permissionValidator, abilityTransaction } = params;

  const { installValidationsCalldata, grantAccessCalldata } =
    await getValidatorInstallationCalldata({
      kernelAccountAddress: kernelAccount.address,
      permissionValidator,
    });

  const calls = [
    {
      to: kernelAccount.address,
      value: 0n,
      data: installValidationsCalldata,
    },
    {
      to: kernelAccount.address,
      value: 0n,
      data: grantAccessCalldata,
    },
    {
      to: abilityTransaction.to,
      value: BigInt(abilityTransaction.value),
      data: abilityTransaction.data,
    },
  ];

  const batchedCallData = await kernelAccount.encodeCalls(calls);

  return batchedCallData;
}

export interface IsValidatorEnabledParams {
  publicClient: PublicClient;
  smartAccountAddress: Address;
  permissionValidator: Awaited<ReturnType<typeof toPermissionValidator>>;
}

export async function isValidatorEnabled(params: IsValidatorEnabledParams): Promise<boolean> {
  const { publicClient, smartAccountAddress, permissionValidator } = params;

  try {
    const permissionId = permissionValidator.getIdentifier();
    const permissionConfig = await readContract(publicClient, {
      abi: KernelV3_3AccountAbi,
      address: smartAccountAddress,
      functionName: 'permissionConfig',
      args: [permissionId],
    });

    return permissionConfig.signer === permissionValidator.address;
  } catch (error) {
    return false;
  }
}
