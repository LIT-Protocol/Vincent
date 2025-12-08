import type { Address } from 'viem';
import type { PrivateKeyAccount } from 'viem/accounts';

import { zeroAddress } from 'viem';

import type { CrossmintSmartAccountInfo } from '../types';

import { getCrossmintWalletApiClient } from '../../environment/crossmint';

export interface SetupCrossmintAccountParams {
  ownerAccount: PrivateKeyAccount;
  permittedAddress: Address;
  chain: { network: string };
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

  if (crossmintAccount && !('error' in crossmintAccount)) {
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
            signer: `evm-keypair:${permittedAddress}`,
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
  // If it's already deployed, this will fail gracefully
  console.log(`[setupCrossmintAccount] Deploying Crossmint Smart Account with empty UserOp...`);
  const deployUserOp = await crossmintWalletApiClient.createTransaction(crossmintAccount.address, {
    params: {
      calls: [
        {
          data: '0x',
          to: zeroAddress,
          value: '0',
        },
      ],
      chain: chain.network as any,
      signer: ownerAccount.address,
    },
  });

  if ('error' in deployUserOp) {
    // Check if error is because wallet is already deployed
    const errorMessage = JSON.stringify(deployUserOp.error).toLowerCase();
    if (errorMessage.includes('already deployed') || errorMessage.includes('already exists')) {
      console.log(`✅ Crossmint Smart Account already deployed, skipping deployment...`);
    } else {
      throw new Error(
        `Could not create crossmint deploy user operation. Error: ${JSON.stringify(deployUserOp.error)}`,
      );
    }
  } else {
    // Account needs deployment - sign and approve the transaction
    const deployUserOpSignature = await ownerAccount.signMessage({
      message: { raw: (deployUserOp.onChain as any).userOperationHash },
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

    console.log(`✅ Crossmint Smart Account deployed`);
  }

  return {
    account: crossmintAccount,
  };
}
