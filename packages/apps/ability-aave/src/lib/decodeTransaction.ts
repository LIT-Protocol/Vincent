import type {
  DecodedTransaction,
  DecodeTransactionParams,
  LowLevelCall,
} from '@lit-protocol/vincent-ability-sdk/gatedSigner';
import { FEE_DIAMOND_ABI } from '@lit-protocol/vincent-contracts-sdk';
import type { Abi } from 'viem';

import { decodeFunctionData } from 'viem';

import { AAVE_POOL_ABI } from './helpers/aave';
import { ERC20_ABI } from './helpers/erc20';
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

  const aaveTransaction = decodeTransactionKind({
    transaction,
    abi: AAVE_POOL_ABI,
    kind: TransactionKind.AAVE,
  });
  const erc20Transaction = decodeTransactionKind({
    transaction,
    abi: ERC20_ABI,
    kind: TransactionKind.ERC20,
  });
  const feeTransaction = decodeTransactionKind({
    transaction,
    abi: FEE_DIAMOND_ABI as Abi,
    kind: TransactionKind.FEE,
  });

  return (
    aaveTransaction ||
    erc20Transaction ||
    feeTransaction || { kind: 'error', message: 'Unknown transaction type. Could not decode' }
  );
};
