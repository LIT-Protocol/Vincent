import type { Address, Chain } from 'viem';
import { createPublicClient, createWalletClient, formatEther, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createKernelAccount, createKernelAccountClient } from '@zerodev/sdk';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { getEntryPoint, KERNEL_V3_3 } from '@zerodev/sdk/constants';

import { ensureWalletHasTokens } from '../wallets/ensureWalletHasTokens';
import { installPermissionValidator } from './installPermissionValidator';

export interface SmartAccountInfo {
  smartAccountAddress: Address;
  deploymentTxHash?: `0x${string}`;
  validatorInstallTxHash?: `0x${string}`;
}

export interface deploySmartAccountToChainParams {
  userEoaPrivateKey: `0x${string}`;
  agentSignerAddress?: Address;
  accountIndexHash: string;
  targetChain: Chain;
  targetChainRpcUrl: string;
  zerodevProjectId: string;
  funderPrivateKey: `0x${string}`;
  fundAmountBeforeDeployment?: bigint;
}

export async function deploySmartAccountToChain({
  userEoaPrivateKey,
  agentSignerAddress,
  accountIndexHash,
  targetChain,
  targetChainRpcUrl,
  zerodevProjectId,
  funderPrivateKey,
  fundAmountBeforeDeployment,
}: deploySmartAccountToChainParams): Promise<SmartAccountInfo> {
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

  let deploymentTxHash: `0x${string}` | undefined;
  if (!isAlreadyDeployed) {
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

  // Step 4: Install permission validator (PKP) if agentSignerAddress is provided
  let validatorInstallTxHash: `0x${string}` | undefined;
  if (agentSignerAddress) {
    const result = await installPermissionValidator({
      userEoaPrivateKey,
      agentSignerAddress,
      accountIndexHash,
      targetChain,
      targetChainRpcUrl,
      zerodevProjectId,
    });
    validatorInstallTxHash = result.txHash;
    console.log(`Permission validator installed successfully`);
    console.table({
      'PKP Signer Address': agentSignerAddress,
      'Validator Installation Tx Hash': validatorInstallTxHash,
    });
  } else {
    console.log('Skipping permission validator installation (agentSignerAddress not provided)');
  }

  return {
    smartAccountAddress: userEoaKernelAccount.address,
    deploymentTxHash,
    validatorInstallTxHash,
  };
}
