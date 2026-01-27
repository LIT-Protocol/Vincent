import type { Hex, LocalAccount, SignableMessage } from 'viem';
import { toAccount, privateKeyToAddress } from 'viem/accounts';
import { signMessage, signTransaction, signTypedData } from 'viem/accounts';

export interface VincentViemPkpSignerParams {
  privateKey: Hex;
  onSignUserOpHash?: (params: { userOpHash: Hex; userOp: any }) => Promise<Hex>;
}

export function createVincentViemPkpSigner(
  params: VincentViemPkpSignerParams
): LocalAccount & { setCurrentUserOp: (userOp: any) => void } {
  const { privateKey, onSignUserOpHash } = params;

  let currentUserOp: any = null;

  const account = toAccount({
    address: privateKeyToAddress(privateKey),

    async signMessage({ message }: { message: SignableMessage }): Promise<Hex> {
      console.log('[createVincentViemPkpSigner] signMessage called by ZeroDev');
      console.log('message:', message);
      console.log('message type:', typeof message);
      console.log('currentUserOp status:', currentUserOp ? 'SET' : 'NOT SET');

      let userOpHash: Hex | undefined;
      if (typeof message === 'object' && 'raw' in message) {
        userOpHash = message.raw as Hex;
        console.log('message.raw (UserOp hash):', userOpHash);

        if (currentUserOp) {
          console.log(
            'Full UserOp available for Lit Action:',
            JSON.stringify(
              currentUserOp,
              (key, value) => (typeof value === 'bigint' ? value.toString() : value),
              2
            )
          );
        } else {
          throw new Error(
            '[createVincentViemPkpSigner] currentUserOp is null, wrapKernelAccountWithUserOpCapture did not intercept correctly'
          );
        }
      }

      // If callback provided and we have the full UserOp, use it
      if (onSignUserOpHash && userOpHash && currentUserOp) {
        const signature = await onSignUserOpHash({
          userOpHash,
          userOp: currentUserOp,
        });
        // Clear the current UserOp after signing
        currentUserOp = null;
        return signature;
      }

      // Fallback to direct signing with private key
      if (privateKey) {
        const signature = await signMessage({ message, privateKey });
        currentUserOp = null; // Clear after signing
        return signature;
      }

      throw new Error('signMessage: No privateKey provided');
    },

    async signTransaction(transaction: any, options?: { serializer?: any }): Promise<Hex> {
      console.log('[createVincentViemPkpSigner] signTransaction called by ZeroDev');
      console.log('transaction:', JSON.stringify(transaction, null, 2));
      console.log('options:', options);
      console.log('currentUserOp status:', currentUserOp ? 'SET' : 'NOT SET');

      if (privateKey) {
        return signTransaction({
          privateKey,
          transaction,
          serializer: options?.serializer,
        });
      }

      throw new Error('[createVincentViemPkpSigner] signTransaction: No privateKey provided');
    },

    async signTypedData(parameters: any): Promise<Hex> {
      console.log('[createVincentViemPkpSigner] signTypedData called by ZeroDev');
      console.log('parameters:', JSON.stringify(parameters, null, 2));
      if (parameters.domain) console.log('parameters.domain:', parameters.domain);
      if (parameters.types) console.log('parameters.types:', parameters.types);
      if (parameters.primaryType) console.log('parameters.primaryType:', parameters.primaryType);
      if (parameters.message) console.log('parameters.message:', parameters.message);

      if (privateKey) {
        return signTypedData({ ...parameters, privateKey });
      }

      throw new Error('[createVincentViemPkpSigner] signTypedData: No privateKey provided');
    },
  }) as LocalAccount & { setCurrentUserOp: (userOp: any) => void };

  // Add method to set the current UserOp before signing
  account.setCurrentUserOp = (userOp: any) => {
    currentUserOp = userOp;
  };

  return account;
}
