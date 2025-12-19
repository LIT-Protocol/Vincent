import type { WalletsApiClient } from '@crossmint/wallets-sdk';
import type { Address, Chain, Hex } from 'viem';

/**
 * Transaction type for Crossmint UserOps
 */
export interface CrossmintTransaction {
  to: Address;
  data: Hex;
  value?: string;
}

export interface TransactionsToCrossmintUserOpParams {
  crossmintClient: WalletsApiClient;
  crossmintAccountAddress: Address;
  permittedAddress: Address;
  transactions: CrossmintTransaction[];
  chain: Chain;
}

export interface SendPermittedCrossmintUserOperationParams {
  crossmintClient: WalletsApiClient;
  accountAddress: Address;
  signature: Hex;
  signerAddress: Address;
  userOp: { id: string };
}

/**
 * Create a Crossmint UserOp from transactions.
 * Returns the UserOp object containing the id and onChain.userOperation for signing.
 */
export async function transactionsToCrossmintUserOp({
  crossmintClient,
  crossmintAccountAddress,
  permittedAddress,
  transactions,
  chain,
}: TransactionsToCrossmintUserOpParams) {
  const crossmintUserOp = await crossmintClient.createTransaction(crossmintAccountAddress, {
    params: {
      calls: transactions.map((t) => ({
        data: t.data,
        to: t.to,
        value: t.value || '0',
      })),
      // @ts-expect-error - Crossmint expects specific chain literal, viem Chain.name is generic string
      chain: chain.name.toLowerCase(),
      signer: permittedAddress,
    },
  });

  if ('error' in crossmintUserOp) {
    throw new Error(
      `Could not create crossmint user operation. Error: ${JSON.stringify(crossmintUserOp.error)}`,
    );
  }

  return crossmintUserOp;
}

/**
 * Send a signed Crossmint UserOp to the bundler.
 * Returns the UserOp hash.
 */
export async function sendPermittedCrossmintUserOperation({
  crossmintClient,
  accountAddress,
  signature,
  signerAddress,
  userOp,
}: SendPermittedCrossmintUserOperationParams): Promise<Hex> {
  const userOpApproval = await crossmintClient.approveTransaction(accountAddress, userOp.id, {
    approvals: [
      {
        signer: `external-wallet:${signerAddress}`,
        signature: signature,
      },
    ],
  });

  if ('error' in userOpApproval) {
    throw new Error(
      `Could not sign crossmint user operation. Error: ${JSON.stringify(userOpApproval.error)}`,
    );
  }

  // Type guard for userOperationHash
  if (!('userOperationHash' in userOpApproval.onChain)) {
    throw new Error('Unexpected response format: missing userOperationHash');
  }

  console.log(
    '[sendPermittedCrossmintUserOperation] UserOp hash:',
    userOpApproval.onChain.userOperationHash,
  );

  return userOpApproval.onChain.userOperationHash as Hex;
}
