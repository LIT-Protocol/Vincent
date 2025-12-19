import type { Chain, Hex } from 'viem';
import { createPublicClient, http, concat } from 'viem';
import { deserializePermissionAccount } from '@zerodev/permissions';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { createKernelAccountClient, addressToEmptyAccount } from '@zerodev/sdk';
import { KERNEL_V3_3, getEntryPoint } from '@zerodev/sdk/constants';

const kernelVersion = KERNEL_V3_3;
const entryPoint = getEntryPoint('0.7');

export interface RelayTransactionToUserOpParams {
  permittedAddress: `0x${string}`;
  serializedPermissionAccount: string;
  transaction: {
    to: `0x${string}`;
    data: `0x${string}`;
    value: string;
    chainId: number;
    from: `0x${string}`;
  };
  chain: Chain;
  zerodevRpcUrl: string;
}

export interface SubmitSignedUserOpParams {
  permittedAddress: `0x${string}`;
  serializedPermissionAccount: string;
  userOpSignature: Hex;
  userOp: Record<string, unknown>;
  chain: Chain;
  zerodevRpcUrl: string;
}

/**
 * Creates the modular signer for deserializing permission accounts.
 * This matches how the permission account was created during setup.
 */
async function createPermittedSigner(permittedAddress: `0x${string}`) {
  const permittedEmptyAccount = addressToEmptyAccount(permittedAddress);
  return await toECDSASigner({
    signer: permittedEmptyAccount,
  });
}

/**
 * Convert a Relay.link transaction to a UserOperation for smart account execution.
 * This handles deserializing the permission account, building the UserOp with proper gas estimates.
 */
export async function relayTransactionToUserOp(
  params: RelayTransactionToUserOpParams,
): Promise<Record<string, unknown>> {
  const { permittedAddress, serializedPermissionAccount, transaction, chain, zerodevRpcUrl } =
    params;

  // Create ZeroDev transport
  const zerodevTransport = http(zerodevRpcUrl);

  // Create public client
  const publicClient = createPublicClient({
    chain,
    transport: zerodevTransport,
  });

  // Create the signer that matches how the permission account was serialized
  const permittedSigner = await createPermittedSigner(permittedAddress);

  // Deserialize the permission account with the signer
  const permissionAccount = await deserializePermissionAccount(
    publicClient,
    entryPoint,
    kernelVersion,
    serializedPermissionAccount,
    permittedSigner,
  );

  // Create kernel client with the permission account
  // No paymaster - smart account will pay for gas using its own balance
  const kernelClient = createKernelAccountClient({
    chain,
    account: permissionAccount,
    bundlerTransport: zerodevTransport,
    client: publicClient,
  });

  // Prepare the UserOp
  const userOp = await kernelClient.prepareUserOperation({
    callData: await permissionAccount.encodeCalls([
      {
        to: transaction.to,
        value: BigInt(transaction.value || '0'),
        data: transaction.data,
      },
    ]),
  });

  return userOp as unknown as Record<string, unknown>;
}

/**
 * Submit a signed UserOperation to the ZeroDev bundler.
 *
 * This follows the Kernel v3 signature format:
 * - The signature is prefixed with 0xff to indicate "raw signature mode"
 * - This tells the Kernel account to use the signature as-is without additional processing
 *
 * Returns both the UserOp hash and the transaction hash once mined.
 */
export async function submitSignedUserOp(
  params: SubmitSignedUserOpParams,
): Promise<{ userOpHash: Hex; transactionHash: Hex }> {
  const {
    permittedAddress,
    serializedPermissionAccount,
    userOpSignature,
    userOp,
    chain,
    zerodevRpcUrl,
  } = params;

  // Create ZeroDev transport for bundler
  const zerodevTransport = http(zerodevRpcUrl);

  // Create public client
  const publicClient = createPublicClient({
    chain,
    transport: zerodevTransport,
  });

  // Create the signer that matches how the permission account was serialized
  const permittedSigner = await createPermittedSigner(permittedAddress);

  // Deserialize the permission account with the signer
  const permissionAccount = await deserializePermissionAccount(
    publicClient,
    entryPoint,
    kernelVersion,
    serializedPermissionAccount,
    permittedSigner,
  );

  // Create kernel client with ZeroDev bundler
  // No paymaster - smart account will pay for gas using its own balance
  const kernelClient = createKernelAccountClient({
    chain,
    account: permissionAccount,
    bundlerTransport: zerodevTransport,
    client: publicClient,
  });

  // Add signature to UserOp with 0xff prefix per Kernel v3 validation
  // The 0xff prefix indicates "raw signature mode" - use signature as-is
  const signedUserOp = {
    ...userOp,
    signature: concat(['0xff', userOpSignature]),
  };

  console.log('[submitSignedUserOp] Broadcasting UserOp to ZeroDev bundler...');
  const userOpHash = await kernelClient.sendUserOperation(signedUserOp as any);
  console.log(`[submitSignedUserOp] UserOp hash: ${userOpHash}`);

  console.log('[submitSignedUserOp] Waiting for UserOp to be included in a block...');
  const receipt = await kernelClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  console.log('[submitSignedUserOp] ✅ UserOp executed successfully!');
  console.log(`[submitSignedUserOp] Transaction hash: ${receipt.receipt.transactionHash}`);

  return {
    userOpHash,
    transactionHash: receipt.receipt.transactionHash,
  };
}
