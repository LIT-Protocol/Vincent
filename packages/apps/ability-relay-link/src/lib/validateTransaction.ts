import type {
  DecodedTransactionSuccess,
  DecodedTransactionError,
  ValidateTransactionParams,
} from '@lit-protocol/vincent-ability-sdk/gatedSigner';
import type { Address } from 'viem';

import { isAddressEqual } from 'viem';

import { fetchRelayLinkAddresses } from './helpers/relay-link';
import { TransactionKind } from './helpers/transactionKind';

export const validateTransaction = async (params: ValidateTransactionParams) => {
  const { chainId, decodedTransaction } = params;

  if (decodedTransaction.kind === 'error') {
    const decodedTransactionError = decodedTransaction as DecodedTransactionError;
    throw new Error(`Transaction failed to decode: ${decodedTransactionError.message}`);
  }

  const decodedTransactionSuccess = decodedTransaction as DecodedTransactionSuccess;

  // Fetch Relay.link addresses for this chain from the API
  const relayAddresses = await fetchRelayLinkAddresses(chainId);

  // Validate ERC20 transactions (approvals for Relay.link contracts)
  if (decodedTransaction.kind === TransactionKind.ERC20) {
    if (['approve', 'increaseAllowance'].includes(decodedTransactionSuccess.fn)) {
      const [spender, amount] = decodedTransactionSuccess.args as [Address, bigint];

      // Only allow approvals to Relay.link contracts
      const isRelaySpender = relayAddresses.some((addr) => isAddressEqual(spender, addr));
      if (!isRelaySpender) {
        throw new Error(
          `ERC20 approval to non-Relay.link spender ${spender}. Allowed: ${relayAddresses.join(', ')}`,
        );
      }

      // Block infinite approvals for safety
      if (amount === 2n ** 256n - 1n) {
        throw new Error('Infinite approval not allowed');
      }

      return;
    }

    throw new Error(`ERC20 function ${decodedTransactionSuccess.fn} not allowed`);
  }

  // Validate Relay.link transactions
  if (decodedTransaction.kind === TransactionKind.RELAY_LINK) {
    const isValidTarget = relayAddresses.some((addr) =>
      isAddressEqual(decodedTransactionSuccess.to as Address, addr),
    );

    if (!isValidTarget) {
      throw new Error(
        `Transaction target ${decodedTransactionSuccess.to} is not a known Relay.link contract. Allowed: ${relayAddresses.join(', ')}`,
      );
    }

    return;
  }

  throw new Error(
    `Unknown transaction kind: ${decodedTransaction.kind}. Only ERC20 approvals and Relay.link transactions are allowed.`,
  );
};
