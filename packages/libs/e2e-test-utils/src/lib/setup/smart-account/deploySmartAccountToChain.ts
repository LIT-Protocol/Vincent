import type { Address, Chain } from 'viem';
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

/**
 * Deploy a smart account to any chain with permission validator configured using initConfig.
 *
 * Implementation strategy (Kernel v3 initConfig session key pattern):
 * 1. Creates ECDSA validator for user EOA (sudo signer)
 * 2. Creates permission validator for PKP signer with sudo policy
 * 3. Creates kernel account with:
 *    - EOA as sudo validator
 *    - PKP signer installed as session key via initConfig (not as regular validator)
 * 4. Funds the smart account if needed (optional)
 * 5. Checks if smart account is already deployed on-chain
 * 6. If not deployed, creates kernel account client and deploys via a dummy transaction
 * 7. Serializes the permission account for runtime UserOp signing
 * 8. Returns deployment info including smart account address, deployment tx hash, and SmartAccountInfo
 *
 * The initConfig approach (from zerodev-examples/session-keys/install-permissions-with-init-config.ts)
 * allows installing the PKP session key at deployment time. This creates a smart account where:
 * - The EOA is the sudo (owner) signer
 * - The PKP is a permitted session signer with sudo policy
 *
 * IMPORTANT: This function's logic MUST match deriveAgentAccountAddress in registry-backend
 * to ensure the calculated counterfactual address matches the deployed smart account address.
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
  agentSignerAddress: Address;
  accountIndexHash: string;
  targetChain: Chain;
  targetChainRpcUrl: string;
  zerodevProjectId: string;
  funderPrivateKey: `0x${string}`;
  fundAmountBeforeDeployment?: bigint;
}): Promise<SmartAccountInfo> {
  console.log(`=== Deploying Smart Account to ${targetChain.name} ===`);

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

  // Check if smart account is already deployed on the target chain
  const existingCode = await publicClient.getCode({
    address: userEoaKernelAccount.address,
  });
  const isAlreadyDeployed = existingCode && existingCode !== '0x';

  if (isAlreadyDeployed) {
    console.log(`Smart account already deployed on ${targetChain.name}`);
    console.table({
      Chain: `${targetChain.name} (${targetChain.id})`,
      'Smart Account Address': userEoaKernelAccount.address,
      Status: 'Already Deployed',
    });
  }

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

  // Step 3: Deploy the smart account (only if not already deployed)
  let deploymentTxHash: string | undefined;

  if (!isAlreadyDeployed) {
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
    deploymentTxHash = receipt.receipt.transactionHash;
    console.log(`Deployment Tx Hash: ${deploymentTxHash}`);

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
  }

  // Serialize the permission account, passing the permission validator as the 5th parameter
  // This is required when using initConfig pattern (see zerodev-examples/session-keys/install-permissions-with-init-config.ts:65)
  return {
    smartAccountAddress: userEoaKernelAccount.address,
    deploymentTxHash,
    serializedPermissionAccount: await serializePermissionAccount(
      userEoaKernelAccount,
      undefined,
      undefined,
      undefined,
      agentSignerPermissionPlugin,
    ),
  };
}
