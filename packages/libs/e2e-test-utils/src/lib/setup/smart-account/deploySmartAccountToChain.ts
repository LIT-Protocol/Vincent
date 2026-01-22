import type { Chain } from 'viem';
import { createPublicClient, createWalletClient, formatEther, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createKernelAccount, createKernelAccountClient } from '@zerodev/sdk';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { getEntryPoint, KERNEL_V3_3 } from '@zerodev/sdk/constants';

import { ensureWalletHasTokens } from '../wallets/ensureWalletHasTokens';
import type { SmartAccountInfo } from '../types';

/**
 * Deploy a smart account to any chain with ONLY the EOA validator.
 *
 * Implementation strategy (Simplified deployment - works on ANY ERC-4337 chain):
 * 1. Creates ECDSA validator for user EOA (sudo signer)
 * 2. Creates kernel account with ONLY the EOA as sudo validator
 * 3. Funds the smart account if needed (optional)
 * 4. Checks if smart account is already deployed on-chain
 * 5. If not deployed, creates kernel account client and deploys via a dummy transaction
 * 6. Returns deployment info including smart account address and deployment tx hash
 *
 * This simplified approach does NOT install the PKP permission validator at deployment time.
 * Instead, the PKP validator will be installed dynamically by abilities during first execution.
 *
 * Benefits:
 * - Works on ANY chain that supports ERC-4337 (no ZeroDev contract requirements)
 * - Lower deployment gas costs
 * - More portable and flexible
 *
 * IMPORTANT: This function's logic MUST match deriveAgentAccountAddress in registry-backend
 * to ensure the calculated counterfactual address matches the deployed smart account address.
 */
export async function deploySmartAccountToChain({
  userEoaPrivateKey,
  accountIndexHash,
  targetChain,
  targetChainRpcUrl,
  zerodevProjectId,
  funderPrivateKey,
  fundAmountBeforeDeployment,
}: {
  userEoaPrivateKey: `0x${string}`;
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

  const userEoaKernelAccount = await createKernelAccount(publicClient, {
    entryPoint: getEntryPoint('0.7'),
    plugins: {
      sudo: userEoaEcdsaValidator,
    },
    kernelVersion: KERNEL_V3_3,
    index: BigInt(accountIndexHash),
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
  let deploymentTxHash: `0x${string}` | undefined;

  if (!isAlreadyDeployed) {
    console.log('Deploying smart account...');

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

  return {
    smartAccountAddress: userEoaKernelAccount.address,
    deploymentTxHash,
  };
}
