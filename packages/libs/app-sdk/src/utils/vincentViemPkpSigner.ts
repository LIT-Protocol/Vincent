import type { Address, Hex, LocalAccount, SignableMessage } from 'viem';
import { toAccount } from 'viem/accounts';

export interface VincentViemPkpSignerParams {
  pkpAddress: Address;
  onSignUserOpHash: (params: { userOpHash: Hex; userOp: any }) => Promise<Hex>;
}

export function createVincentViemPkpSigner(
  params: VincentViemPkpSignerParams
): LocalAccount & { setCurrentUserOp: (userOp: any) => void } {
  const { pkpAddress, onSignUserOpHash } = params;

  let currentUserOp: any = null;

  const account = toAccount({
    address: pkpAddress,

    async signMessage({ message }: { message: SignableMessage }): Promise<Hex> {
      console.log('[createVincentViemPkpSigner] signMessage called by ZeroDev');
      console.log('message:', message);
      console.log('message type:', typeof message);
      console.log('currentUserOp status:', currentUserOp ? 'SET' : 'NOT SET');

      let userOpHash: Hex | undefined;
      if (typeof message === 'object' && 'raw' in message) {
        userOpHash = message.raw as Hex;
        console.log('message.raw (UserOp hash):', userOpHash);

        if (!currentUserOp) {
          throw new Error(
            '[createVincentViemPkpSigner] currentUserOp is null, wrapKernelAccountWithUserOpCapture did not intercept correctly'
          );
        }

        console.log(
          'Full UserOp available for Lit Action:',
          JSON.stringify(
            currentUserOp,
            (key, value) => (typeof value === 'bigint' ? value.toString() : value),
            2
          )
        );

        // Delegate signing to Lit Actions via callback
        const signature = await onSignUserOpHash({
          userOpHash,
          userOp: currentUserOp,
        });

        // Clear the current UserOp after signing
        currentUserOp = null;
        return signature;
      }

      throw new Error('[createVincentViemPkpSigner] signMessage called without UserOp hash');
    },

    async signTransaction(transaction: any, options?: { serializer?: any }): Promise<Hex> {
      console.log('[createVincentViemPkpSigner] signTransaction called by ZeroDev');
      console.log('transaction:', JSON.stringify(transaction, null, 2));
      console.log('options:', options);

      throw new Error(
        '[createVincentViemPkpSigner] signTransaction not supported - use signMessage for UserOps'
      );
    },

    async signTypedData(parameters: any): Promise<Hex> {
      console.log('[createVincentViemPkpSigner] signTypedData called by ZeroDev');
      console.log('parameters:', JSON.stringify(parameters, null, 2));

      throw new Error(
        '[createVincentViemPkpSigner] signTypedData not supported - use signMessage for UserOps'
      );
    },
  }) as LocalAccount & { setCurrentUserOp: (userOp: any) => void };

  // Add method to set the current UserOp before signing
  account.setCurrentUserOp = (userOp: any) => {
    currentUserOp = userOp;
  };

  return account;
}
