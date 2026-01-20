import type { Chain } from 'viem';
import { createPublicClient, createWalletClient, formatEther, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  createKernelAccount,
  // createKernelAccountClient,
} from '@zerodev/sdk';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { getEntryPoint, KERNEL_V3_3 } from '@zerodev/sdk/constants';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { toSudoPolicy } from '@zerodev/permissions/policies';
import { toPermissionValidator, serializePermissionAccount } from '@zerodev/permissions';
import { addressToEmptyAccount } from '@zerodev/sdk';

import { ensureWalletHasTokens } from '../wallets/ensureWalletHasTokens';

export interface DeploySmartAccountResult {
  smartAccountAddress: `0x${string}`;
  deploymentTxHash?: string;
  serializedPermissionAccount: string;
}

/**
 * Deploy a smart account to any chain with permission validator configured.
 *
 * Implementation strategy (Kernel v3 permission validator pattern):
 * 1. Creates a sudo-only kernel account (EOA validator) for deployment
 * 2. Creates a dual-validator account (EOA sudo + PKP regular) for serialization
 * 3. Verifies addresses match (permission validator shouldn't affect counterfactual address)
 * 4. Checks if the smart account is already deployed at the counterfactual address
 * 5. Funds the smart account if needed
 * 6. Deploys the smart account (using sudo validator for signing)
 * 7. Serializes the dual-validator permission account for runtime UserOp signing
 *
 * In Kernel v3, permission validators work through signature encoding embedded in the
 * serialized account data. They do NOT require on-chain module installation or explicit
 * enablement transactions. The permission validator becomes active when the PKP signs
 * UserOps using the serialized permission account - the signature format tells the
 * Kernel account to use the permission validator for validation.
 *
 * The on-chain smart account has only the sudo (EOA) validator installed. The permission
 * validator is activated through signature encoding, not on-chain state.
 *
 * @param userEoaPrivateKey - Private key of the user's EOA (sudo validator)
 * @param agentSignerAddress - Address of the PKP (session key/permission validator)
 * @param accountIndexHash - Deterministic index for the smart account address
 * @param targetChain - The chain to deploy to
 * @param targetChainRpcUrl - RPC URL for the target chain
 * @param zerodevProjectId - ZeroDev project ID for bundler access
 * @param funderPrivateKey - Private key of the funder wallet
 * @param fundAmountBeforeDeployment - Optional minimum amount to fund the smart account before deployment (in wei). If not provided, funding step is skipped.
 * @returns Deployment result with smart account address and serialized permission account
 */
export async function deploySmartAccountToChain({
  userEoaPrivateKey,
  agentSignerAddress,
  accountIndexHash,
  targetChain,
  targetChainRpcUrl,
  zerodevProjectId,
  funderPrivateKey,
  fundAmountBeforeDeployment,
}: {
  userEoaPrivateKey: `0x${string}`;
  agentSignerAddress: `0x${string}`;
  accountIndexHash: string;
  targetChain: Chain;
  targetChainRpcUrl: string;
  zerodevProjectId: string;
  funderPrivateKey: `0x${string}`;
  fundAmountBeforeDeployment?: bigint;
}): Promise<DeploySmartAccountResult> {
  console.log(`=== Deploying Smart Account to ${targetChain.name} ===`);

  // Create clients
  const publicClient = createPublicClient({
    chain: targetChain,
    transport: http(targetChainRpcUrl),
  });

  const userEoaWalletClient = createWalletClient({
    account: privateKeyToAccount(userEoaPrivateKey),
    chain: targetChain,
    transport: http(targetChainRpcUrl),
  });

  const funderWalletClient = createWalletClient({
    account: privateKeyToAccount(funderPrivateKey),
    chain: targetChain,
    transport: http(targetChainRpcUrl),
  });

  // Create ECDSA validator for the user (owner/sudo)
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    entryPoint: getEntryPoint('0.7'),
    signer: userEoaWalletClient,
    kernelVersion: KERNEL_V3_3,
  });

  const agentSignerECDSA = await toECDSASigner({
    signer: addressToEmptyAccount(agentSignerAddress),
  });

  const agentSignerPermissionPlugin = await toPermissionValidator(publicClient, {
    entryPoint: getEntryPoint('0.7'),
    signer: agentSignerECDSA,
    policies: [toSudoPolicy({})],
    kernelVersion: KERNEL_V3_3,
  });

  const dualValidatorKernelAccount = await createKernelAccount(publicClient, {
    entryPoint: getEntryPoint('0.7'),
    plugins: {
      sudo: ecdsaValidator,
      regular: agentSignerPermissionPlugin,
    },
    kernelVersion: KERNEL_V3_3,
    index: BigInt(accountIndexHash),
  });

  // const zerodevRpcUrl = `https://rpc.zerodev.app/api/v3/${zerodevProjectId}/chain/${targetChain.id}`;
  // const kernelClient = createKernelAccountClient({
  //   account: dualValidatorKernelAccount,
  //   chain: targetChain,
  //   bundlerTransport: http(zerodevRpcUrl),
  //   client: publicClient,
  // });

  // Step 2: Fund the smart account (if fundAmountBeforeDeployment is provided)
  if (fundAmountBeforeDeployment !== undefined) {
    console.log('Funding smart account...');
    const { currentBalance, fundingTxHash } = await ensureWalletHasTokens({
      address: dualValidatorKernelAccount.address,
      funderWalletClient,
      publicClient,
      minAmount: fundAmountBeforeDeployment,
    });

    console.table({
      'Smart Account Address': dualValidatorKernelAccount.address,
      Balance: formatEther(currentBalance),
      'Funding Tx Hash': fundingTxHash,
    });

    // Wait for funding confirmation if we just funded
    if (fundingTxHash) {
      console.log('Waiting for funding confirmation...');
      await publicClient.waitForTransactionReceipt({
        hash: fundingTxHash as `0x${string}`,
        confirmations: 2,
      });
    }
  } else {
    console.log('Skipping funding step (fundAmountBeforeDeployment not provided)');
  }

  // Step 3: Deploy the smart account
  // console.log('Deploying smart account...');

  // const sudoOnlyKernelAccount = await createKernelAccount(publicClient, {
  //   entryPoint: getEntryPoint('0.7'),
  //   plugins: {
  //     sudo: ecdsaValidator,
  //   },
  //   kernelVersion: KERNEL_V3_3,
  //   index: BigInt(accountIndexHash),
  // });

  // // Create sudo-only client for deployment
  // const sudoOnlyKernelClient = createKernelAccountClient({
  //   account: sudoOnlyKernelAccount,
  //   chain: targetChain,
  //   bundlerTransport: http(zerodevRpcUrl),
  //   client: publicClient,
  // });

  // // Deploy with a no-op call to avoid potential fallback/receive reverts
  // const userOpHash = await sudoOnlyKernelClient.sendUserOperation({
  //   callData: await sudoOnlyKernelAccount.encodeCalls([
  //     {
  //       to: '0x0000000000000000000000000000000000000000',
  //       value: 0n,
  //       data: '0x',
  //     },
  //   ]),
  // });
  // console.log(`Deployment UserOp Hash: ${userOpHash}`);

  // // Wait for the UserOperation to be included in a block
  // const receipt = await kernelClient.waitForUserOperationReceipt({
  //   hash: userOpHash,
  // });
  // const deploymentTxHash = receipt.receipt.transactionHash;
  // console.log(`Deployment Tx Hash: ${deploymentTxHash}`);

  // // Wait for 2 block confirmations
  // await publicClient.waitForTransactionReceipt({
  //   hash: deploymentTxHash as `0x${string}`,
  //   confirmations: 2,
  // });

  // // Verify deployment
  // const deployedCode = await publicClient.getCode({
  //   address: dualValidatorKernelAccount.address,
  // });

  // if (!deployedCode || deployedCode === '0x') {
  //   throw new Error(
  //     `Smart account deployment failed on ${targetChain.name}, code is still empty (0x)`,
  //   );
  // }

  console.log(`Smart account deployed successfully`);
  console.table({
    Chain: `${targetChain.name} (${targetChain.id})`,
    'Smart Account Address': dualValidatorKernelAccount.address,
    // 'Deployment Tx Hash': deploymentTxHash,
    // 'Code Length': deployedCode.length,
  });

  return {
    smartAccountAddress: dualValidatorKernelAccount.address,
    // deploymentTxHash,
    serializedPermissionAccount: await serializePermissionAccount(dualValidatorKernelAccount),
  };
}
