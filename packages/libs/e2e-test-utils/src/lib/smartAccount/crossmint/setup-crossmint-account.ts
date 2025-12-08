import type { Address, Chain } from 'viem';
import type { PrivateKeyAccount } from 'viem/accounts';

import { zeroAddress } from 'viem';

import type { CrossmintSmartAccountInfo } from '../types';

import { getCrossmintWalletApiClient } from '../../environment/crossmint';

export interface SetupCrossmintAccountParams {
  ownerAccount: PrivateKeyAccount;
  permittedAddress: Address;
  chain: Chain;
}

export async function setupCrossmintAccount({
  ownerAccount,
  permittedAddress,
  chain,
}: SetupCrossmintAccountParams): Promise<CrossmintSmartAccountInfo> {
  const crossmintWalletApiClient = getCrossmintWalletApiClient();

  // Use email-based owner for idempotency
  // This ensures we don't create duplicate wallets for the same owner
  const userEmail = `${ownerAccount.address.toLowerCase()}@wallet.local`;
  const walletLocator = `email:${userEmail}:evm:smart`;

  // Check if wallet already exists
  let crossmintAccount = await crossmintWalletApiClient.getWallet(walletLocator).catch(() => null);
  let accountAlreadyExisted = false;

  if (crossmintAccount && !('error' in crossmintAccount)) {
    accountAlreadyExisted = true;
    console.log(
      `[setupCrossmintAccount] ✅ Crossmint Smart Account already exists at: ${crossmintAccount.address}`,
    );
  } else {
    console.log(`[setupCrossmintAccount] Creating new Crossmint Smart Account...`);

    crossmintAccount = await crossmintWalletApiClient.createWallet({
      chainType: 'evm',
      type: 'smart',
      owner: `email:${userEmail}`,
      config: {
        adminSigner: {
          type: 'external-wallet',
          address: ownerAccount.address,
        },
        delegatedSigners: [
          {
            signer: {
              type: 'external-wallet',
              address: permittedAddress,
            },
          },
        ],
      },
    });

    if ('error' in crossmintAccount) {
      throw new Error(
        `Failed to create Crossmint wallet: ${JSON.stringify(crossmintAccount.error)}`,
      );
    }

    console.log(
      `[setupCrossmintAccount] Crossmint Smart Account address: ${crossmintAccount.address}`,
    );
  }

  // Try to deploy the smart account with an empty user op
  const deployUserOp = await crossmintWalletApiClient.createTransaction(crossmintAccount.address, {
    params: {
      calls: [
        {
          data: '0x',
          to: zeroAddress,
          value: '0',
        },
      ],
      // @ts-expect-error - Crossmint expects specific chain literal union, viem Chain.name is generic string. Runtime validates.
      chain: chain.name,
      signer: ownerAccount.address,
    },
  });

  if ('error' in deployUserOp) {
    // Error creating deploy transaction - account is likely already deployed
    if (accountAlreadyExisted) {
      console.log(`[setupCrossmintAccount] ✅ Smart Account already deployed`);
    } else {
      console.log(`[setupCrossmintAccount] Skipping deployment (unable to create transaction)`);
    }
  } else {
    // Account needs deployment - sign and approve the transaction
    console.log(`[setupCrossmintAccount] Deploying Smart Account with empty UserOp...`);

    if (!('userOperationHash' in deployUserOp.onChain)) {
      throw new Error('Unexpected transaction response format: missing userOperationHash');
    }

    const deployUserOpSignature = await ownerAccount.signMessage({
      message: { raw: deployUserOp.onChain.userOperationHash as `0x${string}` },
    });

    const deployUserOpApproval = await crossmintWalletApiClient.approveTransaction(
      crossmintAccount.address,
      deployUserOp.id,
      {
        approvals: [
          {
            signer: `external-wallet:${ownerAccount.address}`,
            signature: deployUserOpSignature,
          },
        ],
      },
    );
    if ('error' in deployUserOpApproval) {
      throw new Error(
        `Could not sign crossmint deploy user operation. Error: ${JSON.stringify(deployUserOpApproval.error)}`,
      );
    }

    console.log(`[setupCrossmintAccount] ✅ Smart Account deployed`);
  }

  return {
    account: crossmintAccount,
  };
}
