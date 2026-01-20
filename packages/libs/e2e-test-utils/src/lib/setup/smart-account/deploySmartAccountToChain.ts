import type { Chain } from 'viem';
import { createPublicClient, createWalletClient, formatEther, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createKernelAccount, createKernelAccountClient } from '@zerodev/sdk';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { getEntryPoint, KERNEL_V3_3 } from '@zerodev/sdk/constants';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { toSudoPolicy } from '@zerodev/permissions/policies';
import {
  toPermissionValidator,
  serializePermissionAccount,
  toInitConfig,
} from '@zerodev/permissions';
import { addressToEmptyAccount } from '@zerodev/sdk';

import { ensureWalletHasTokens } from '../wallets/ensureWalletHasTokens';
import type { SmartAccountInfo } from '../types';

export interface DeploySmartAccountResult {
  smartAccountAddress: `0x${string}`;
  deploymentTxHash?: string;
  serializedPermissionAccount: string;
  smartAccount: SmartAccountInfo;
}

/**
 * Deploy a smart account to any chain with permission validator configured using initConfig.
 *
 * Implementation strategy (Kernel v3 initConfig session key pattern):
 * 1. Creates a kernel account with EOA as sudo validator
 * 2. Installs the PKP signer as a session key using initConfig (not as a regular validator)
 * 3. The initConfig pattern enables the session key during account deployment
 * 4. Funds the smart account if needed
 * 5. Serializes the permission account for runtime UserOp signing
 *
 * The initConfig approach (from zerodev-examples/session-keys/install-permissions-with-init-config.ts)
 * allows installing the PKP session key at deployment time. This creates a smart account where:
 * - The EOA is the sudo (owner) signer
 * - The PKP is a permitted session signer with sudo policy
 *
 * IMPORTANT: This function's logic MUST match deriveAgentAccountAddress in registry-backend
 * to ensure the calculated counterfactual address matches the deployed smart account address.
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

  const userEoaEcdsaValidator = await signerToEcdsaValidator(publicClient, {
    entryPoint: getEntryPoint('0.7'),
    signer: userEoaWalletClient,
    kernelVersion: KERNEL_V3_3,
  });

  const agentECDSASigner = await toECDSASigner({
    signer: addressToEmptyAccount(agentSignerAddress),
  });

  const agentSignerPermissionPlugin = await toPermissionValidator(publicClient, {
    entryPoint: getEntryPoint('0.7'),
    signer: agentECDSASigner,
    policies: [toSudoPolicy({})],
    kernelVersion: KERNEL_V3_3,
  });

  // Use initConfig to install the permission validator as a session key
  // This matches the pattern in zerodev-examples/session-keys/install-permissions-with-init-config.ts
  const userEoaKernelAccount = await createKernelAccount(publicClient, {
    entryPoint: getEntryPoint('0.7'),
    plugins: {
      sudo: userEoaEcdsaValidator,
    },
    kernelVersion: KERNEL_V3_3,
    index: BigInt(accountIndexHash),
    initConfig: await toInitConfig(agentSignerPermissionPlugin),
  });

  const zerodevRpcUrl = `https://rpc.zerodev.app/api/v3/${zerodevProjectId}/chain/${targetChain.id}`;
  const kernelClient = createKernelAccountClient({
    account: userEoaKernelAccount,
    chain: targetChain,
    bundlerTransport: http(zerodevRpcUrl),
    client: publicClient,
  });

  // Step 2: Fund the smart account (if fundAmountBeforeDeployment is provided)
  if (fundAmountBeforeDeployment !== undefined) {
    console.log('Funding smart account...');
    const { currentBalance, fundingTxHash } = await ensureWalletHasTokens({
      address: userEoaKernelAccount.address,
      funderWalletClient,
      publicClient,
      minAmount: fundAmountBeforeDeployment,
    });

    console.table({
      'Smart Account Address': userEoaKernelAccount.address,
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
  // The initConfig will automatically install the session key during deployment
  console.log('Deploying smart account...');

  // Deploy with a no-op call to avoid potential fallback/receive reverts
  const userOpHash = await kernelClient.sendUserOperation({
    callData: await userEoaKernelAccount.encodeCalls([
      {
        to: '0x0000000000000000000000000000000000000000',
        value: 0n,
        data: '0x',
      },
    ]),
  });
  console.log(`Deployment UserOp Hash: ${userOpHash}`);

  // Wait for the UserOperation to be included in a block
  const receipt = await kernelClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });
  const deploymentTxHash = receipt.receipt.transactionHash;
  console.log(`Deployment Tx Hash: ${deploymentTxHash}`);

  // Wait for 2 block confirmations
  await publicClient.waitForTransactionReceipt({
    hash: deploymentTxHash as `0x${string}`,
    confirmations: 2,
  });

  // Verify deployment
  const deployedCode = await publicClient.getCode({
    address: userEoaKernelAccount.address,
  });

  if (!deployedCode || deployedCode === '0x') {
    throw new Error(
      `Smart account deployment failed on ${targetChain.name}, code is still empty (0x)`,
    );
  }

  console.log(`Smart account deployed successfully`);
  console.table({
    Chain: `${targetChain.name} (${targetChain.id})`,
    'Smart Account Address': userEoaKernelAccount.address,
    'Deployment Tx Hash': deploymentTxHash,
  });

  // Serialize the permission account, passing the permission validator as the 5th parameter
  // This is required when using initConfig pattern (see zerodev-examples/session-keys/install-permissions-with-init-config.ts:65)
  const serializedPermissionAccount = await serializePermissionAccount(
    userEoaKernelAccount,
    undefined,
    undefined,
    undefined,
    agentSignerPermissionPlugin,
  );

  // Create public client for the smart account
  const smartAccountPublicClient = createPublicClient({
    chain: targetChain,
    transport: http(targetChainRpcUrl),
  });

  return {
    smartAccountAddress: userEoaKernelAccount.address,
    deploymentTxHash,
    serializedPermissionAccount,
    smartAccount: {
      account: userEoaKernelAccount,
      client: kernelClient,
      publicClient: smartAccountPublicClient,
      walletClient: userEoaWalletClient,
      approval: serializedPermissionAccount,
    },
  };
}
