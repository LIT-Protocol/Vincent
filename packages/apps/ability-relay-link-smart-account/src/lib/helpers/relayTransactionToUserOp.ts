import { deserializePermissionAccount } from '@zerodev/permissions';
import { toECDSASigner } from '@zerodev/permissions/signers';
import {
  addressToEmptyAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from '@zerodev/sdk';
import { KERNEL_V3_3, getEntryPoint } from '@zerodev/sdk/constants';
import { type Address, type Chain, createPublicClient, http, type Hex } from 'viem';

export interface RelayTransaction {
  to: Address;
  data: Hex;
  value?: string | bigint;
  chainId: number;
  from: Address;
}

export interface RelayTransactionToUserOpParams {
  permittedAddress: Address;
  serializedPermissionAccount: string;
  transaction: RelayTransaction;
  chain: Chain;
  rpcUrl: string;
  zerodevRpcUrl: string;
}

/**
 * Converts a Relay.link transaction to an ERC-4337 UserOperation for smart accounts
 *
 * This follows the Relay.link ERC-4337 flow per their official documentation:
 * https://docs.relay.link/references/api/api_guides/smart_accounts/erc-4337
 *
 * 1. Deserializes the permission account
 * 2. Creates an empty account for the permitted PKP address
 * 3. Encodes the transaction as a UserOperation
 * 4. Estimates gas limits
 * 5. Sets fees to 0 (as required by Relay.link)
 * 6. Returns UserOp ready for paymaster data addition and signing
 *
 * Note: A paymaster is REQUIRED when fees are 0. The caller must obtain
 * paymaster data before submitting to Relay.link's bundler endpoint.
 */
export async function relayTransactionToUserOp({
  permittedAddress,
  serializedPermissionAccount,
  transaction,
  chain,
  rpcUrl,
  zerodevRpcUrl,
}: RelayTransactionToUserOpParams) {
  const kernelVersion = KERNEL_V3_3;
  const entryPoint = getEntryPoint('0.7');

  console.log(`[relayTransactionToUserOp] Using ZeroDev RPC URL: ${zerodevRpcUrl}`);

  // Create ZeroDev transport for bundler
  const zerodevTransport = http(zerodevRpcUrl);

  // Create public client using ZeroDev RPC
  const publicClient = createPublicClient({
    chain,
    transport: zerodevTransport,
  });

  // Create empty account for the permitted PKP address
  const vincentEmptyAccount = addressToEmptyAccount(permittedAddress);
  const vincentAbilitySigner = await toECDSASigner({
    signer: vincentEmptyAccount,
  });

  // Deserialize the permission account
  const permissionKernelAccount = await deserializePermissionAccount(
    publicClient,
    entryPoint,
    kernelVersion,
    serializedPermissionAccount,
    vincentAbilitySigner,
  );

  // Check if the account is already deployed
  const accountCode = await publicClient.getCode({
    address: permissionKernelAccount.address,
  });
  const isDeployed = accountCode && accountCode !== '0x';

  console.log(
    `[relayTransactionToUserOp] Account ${permissionKernelAccount.address} is ${isDeployed ? 'already deployed' : 'not deployed yet'}`,
  );

  // Create ZeroDev paymaster client (sponsorship enabled)
  const zerodevPaymaster = createZeroDevPaymasterClient({
    chain,
    transport: zerodevTransport,
  });

  console.log(`[relayTransactionToUserOp] Using ZeroDev paymaster for transaction sponsorship`);

  // Create kernel client WITH paymaster
  const permissionKernelClient = createKernelAccountClient({
    chain,
    account: permissionKernelAccount,
    bundlerTransport: zerodevTransport,
    client: publicClient,
    paymaster: {
      getPaymasterData(userOperation) {
        return zerodevPaymaster.sponsorUserOperation({ userOperation });
      },
    },
  });

  // Encode the Relay.link transaction as a call
  const callData = await permissionKernelAccount.encodeCalls([
    {
      to: transaction.to,
      data: transaction.data,
      value: transaction.value ? BigInt(transaction.value) : BigInt(0),
    },
  ]);

  console.log(`[relayTransactionToUserOp] Preparing UserOperation with ZeroDev paymaster...`);

  // Use prepareUserOperation to get properly structured UserOp
  const userOp = await permissionKernelClient.prepareUserOperation({
    callData,
  });

  console.log(`[relayTransactionToUserOp] ✅ UserOperation prepared:`);
  console.log(`  Sender: ${userOp.sender}`);
  console.log(`  Nonce: ${userOp.nonce}`);
  console.log(`  Max Fee Per Gas: ${userOp.maxFeePerGas}`);
  console.log(`  Max Priority Fee Per Gas: ${userOp.maxPriorityFeePerGas}`);
  console.log(`  Call Gas Limit: ${userOp.callGasLimit}`);
  console.log(`  Verification Gas Limit: ${userOp.verificationGasLimit}`);
  console.log(`  Paymaster: ${userOp.paymaster || 'none'}`);
  console.log(`  Paymaster Verification Gas: ${userOp.paymasterVerificationGasLimit || 'N/A'}`);
  console.log(`  Account is ${isDeployed ? 'deployed' : 'not deployed'}`);
  console.log(`  Transaction will be sponsored by ZeroDev paymaster`);
  console.log(`  Ready for signing by the PKP ability`);

  return userOp;
}
