import { alchemy } from '@account-kit/infra';
import { createModularAccountV2Client } from '@account-kit/smart-contracts';

import { getAlchemyChainConfig } from './get-alchemy-chain-config';
import { LitActionsSmartSigner } from './lit-actions-smart-signer';

declare const Lit: {
  Actions: {
    runOnce: (
      params: {
        waitForResponse: boolean;
        name: string;
      },
      callback: () => Promise<string>,
    ) => Promise<string>;
  };
};

/**
 * Handler function for making raw transaction calls with gas sponsorship
 * This function handles the preparation, signing, and sending of raw transactions
 *
 * @param pkpPublicKey - The PKP public key for transaction signing
 * @param to - The recipient address
 * @param value - The value to send with the transaction
 * @param data - The calldata for the transaction
 * @param chainId - The chain ID
 * @param eip7702AlchemyApiKey - The Alchemy API key for gas sponsorship
 * @param eip7702AlchemyPolicyId - The Alchemy policy ID for gas sponsorship
 * @returns The UserOperation hash. You must use the alchemy smartAccountClient.waitForUserOperationTransaction() to convert the userOp into a txHash.
 */
export const sponsoredGasRawTransaction = async ({
  pkpPublicKey,
  to,
  value,
  data,
  chainId,
  eip7702AlchemyApiKey,
  eip7702AlchemyPolicyId,
}: {
  pkpPublicKey: string;
  to: string;
  value: string;
  data: string;
  chainId: number;
  eip7702AlchemyApiKey: string;
  eip7702AlchemyPolicyId: string;
}): Promise<string> => {
  if (!eip7702AlchemyApiKey || !eip7702AlchemyPolicyId) {
    throw new Error(
      'EIP7702 Alchemy API key and policy ID are required when using Alchemy for gas sponsorship',
    );
  }

  if (!chainId) {
    throw new Error('Chain ID is required when using Alchemy for gas sponsorship');
  }

  console.log('[sponsoredGasRawTransaction] Encoded data:', data);

  // Convert value to BigInt
  const txValue = value ? BigInt(value.toString()) : 0n;

  // Create LitActionsSmartSigner for EIP-7702
  const litSigner = new LitActionsSmartSigner({
    pkpPublicKey,
    chainId,
  });

  // Get the Alchemy chain configuration
  const alchemyChain = getAlchemyChainConfig(chainId);

  // Create the Smart Account Client with EIP-7702 mode
  const smartAccountClient = await createModularAccountV2Client({
    mode: '7702' as const,
    transport: alchemy({ apiKey: eip7702AlchemyApiKey }),
    chain: alchemyChain,
    signer: litSigner,
    policyId: eip7702AlchemyPolicyId,
  });

  console.log('[sponsoredGasRawTransaction] Smart account client created');

  // Prepare the user operation
  const userOperation = {
    target: to as `0x${string}`,
    value: txValue,
    data: data as `0x${string}`,
  };

  console.log('[sponsoredGasRawTransaction] User operation prepared', userOperation);

  // Build the user operation
  const uoStructResponse = await Lit.Actions.runOnce(
    {
      waitForResponse: true,
      name: 'buildUserOperation',
    },
    async () => {
      try {
        const uoStruct = await smartAccountClient.buildUserOperation({
          uo: userOperation,
          account: smartAccountClient.account,
        });
        // Properly serialize BigInt with a "type" tag
        return JSON.stringify(uoStruct, (_, v) =>
          typeof v === 'bigint' ? { type: 'BigInt', value: v.toString() } : v,
        );
      } catch (e: any) {
        console.log('[sponsoredGasRawTransaction] Failed to build user operation, error below');
        console.log(e);
        console.log(e.stack);
        return '';
      }
    },
  );

  if (uoStructResponse === '') {
    throw new Error('[sponsoredGasRawTransaction] Failed to build user operation');
  }

  // Custom reviver to convert {type: "BigInt", value: "..."} back to BigInt
  const uoStruct = JSON.parse(uoStructResponse, (_, v) => {
    if (v && typeof v === 'object' && v.type === 'BigInt' && typeof v.value === 'string') {
      return BigInt(v.value);
    }
    return v;
  });

  console.log('[sponsoredGasRawTransaction] User operation built, starting signing...', uoStruct);

  // sign the actual user operation with the PKP.
  // this must be done outside a runOnce call, because all the nodes must initiate a signature for it to be valid
  const signedUserOperation = await smartAccountClient.signUserOperation({
    account: smartAccountClient.account,
    uoStruct,
  });

  console.log('[sponsoredGasRawTransaction] User operation signed', signedUserOperation);

  // getting the entry point from the smart account client so we can send the user operation
  const entryPoint = smartAccountClient.account.getEntryPoint();

  // send the user operation with EIP-7702 delegation in a runOnce
  // so that we don't submit it more than once
  const uoHash = await Lit.Actions.runOnce(
    {
      waitForResponse: true,
      name: 'sendWithAlchemy',
    },
    async () => {
      try {
        // Send the user operation with EIP-7702 delegation
        const userOpResult = await smartAccountClient.sendRawUserOperation(
          signedUserOperation,
          entryPoint.address,
        );

        console.log(`[sponsoredGasRawTransaction] User operation sent`, {
          userOpHash: userOpResult,
        });

        return userOpResult;
      } catch (e: any) {
        console.log('[sponsoredGasRawTransaction] Failed to send user operation, error below');
        console.log(e);
        console.log(e.stack);
        return '';
      }
    },
  );

  if (uoHash === '') {
    throw new Error('[sponsoredGasRawTransaction] Failed to send user operation');
  }

  return uoHash;
};
