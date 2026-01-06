import type {
  DecodedTransaction,
  DecodeTransactionParams,
  LowLevelCall,
} from '@lit-protocol/vincent-ability-sdk/gatedSigner';
import { ERC20_ABI } from '@lit-protocol/vincent-ability-sdk';
import type { Abi } from 'viem';

import { decodeFunctionData } from 'viem';
import { TransactionKind } from './helpers/transactionKind';

interface DecodeTransactionKindParams {
  abi: Abi;
  kind: TransactionKind;
  transaction: LowLevelCall;
}

const decodeTransactionKind = (
  params: DecodeTransactionKindParams,
): DecodedTransaction | undefined => {
  try {
    const { abi, kind, transaction } = params;
    const df = decodeFunctionData({ abi, data: transaction.data });
    console.log(`Decoded ${kind} transaction`);
    return {
      args: df.args,
      kind,
      fn: df.functionName,
      to: transaction.to,
      value: transaction.value,
    };
  } catch (error) {
    // Could not decode transaction. Likely not the correct ABI. Continue...
    return;
  }
};

export const decodeTransaction = (params: DecodeTransactionParams): DecodedTransaction => {
  const { transaction } = params;

  // Try to decode as ERC20 transaction (e.g., approval before relay)
  const erc20Transaction = decodeTransactionKind({
    transaction,
    abi: ERC20_ABI,
    kind: TransactionKind.ERC20,
  });

  if (erc20Transaction) {
    return erc20Transaction;
  }

  // If not ERC20, assume it's a Relay.link transaction
  // The target address will be validated in validateTransaction (which has chainId)
  console.log('Decoded RELAY_LINK transaction');
  return {
    args: [],
    kind: TransactionKind.RELAY_LINK,
    fn: 'execute',
    to: transaction.to,
    value: transaction.value,
  };
};
