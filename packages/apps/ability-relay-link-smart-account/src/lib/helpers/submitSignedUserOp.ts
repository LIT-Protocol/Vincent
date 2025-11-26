import { Address, Chain, Hex, concat } from 'viem';
import { deserializePermissionAccount } from '@zerodev/permissions';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { createKernelAccountClient, addressToEmptyAccount } from '@zerodev/sdk';
import { KERNEL_V3_3, getEntryPoint } from '@zerodev/sdk/constants';
import { createPublicClient, http } from 'viem';

export interface SubmitSignedUserOpParams {
  permittedAddress: Address;
  serializedPermissionAccount: string;
  userOpSignature: Hex;
  userOp: any;
  chain: Chain;
  zerodevRpcUrl: string;
}

/**
 * Submits a signed UserOperation to ZeroDev bundler
 *
 * This follows the reference pattern from vincent-smart-account-signer where:
 * 1. The ability signs the UserOp and returns the signature
 * 2. The client adds the signature to the UserOp
 * 3. The client submits via ZeroDev's bundler
 *
 * @returns UserOperation hash and transaction receipt
 */
export async function submitSignedUserOp({
  permittedAddress,
  serializedPermissionAccount,
  userOpSignature,
  userOp,
  chain,
  zerodevRpcUrl,
}: SubmitSignedUserOpParams) {
  const kernelVersion = KERNEL_V3_3;
  const entryPoint = getEntryPoint('0.7');

  console.log(`[submitSignedUserOp] Using ZeroDev RPC URL: ${zerodevRpcUrl}`);

  // Create ZeroDev transport for bundler
  const zerodevTransport = http(zerodevRpcUrl);

  // Create public client
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

  // Create kernel client with ZeroDev bundler
  const permissionKernelClient = createKernelAccountClient({
    chain,
    account: permissionKernelAccount,
    bundlerTransport: zerodevTransport,
    client: publicClient,
    // No paymaster - smart account will pay for gas using its own balance
  });

  // Add signature to UserOp (with 0xff prefix per Kernel v3 validation)
  const signedUserOp = {
    ...userOp,
    signature: concat(['0xff', userOpSignature]),
  };

  console.log(`[submitSignedUserOp] Broadcasting UserOp to ZeroDev bundler...`);
  const userOpHash = await permissionKernelClient.sendUserOperation(signedUserOp);
  console.log(`[submitSignedUserOp] UserOp hash: ${userOpHash}`);

  console.log(`[submitSignedUserOp] Waiting for UserOp to be included in a block...`);
  const userOpReceipt = await permissionKernelClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  console.log(`[submitSignedUserOp] ✅ UserOp executed successfully!`);
  console.log(`[submitSignedUserOp] Transaction hash: ${userOpReceipt.receipt.transactionHash}`);

  return {
    userOpHash,
    transactionHash: userOpReceipt.receipt.transactionHash,
    receipt: userOpReceipt.receipt,
  };
}
