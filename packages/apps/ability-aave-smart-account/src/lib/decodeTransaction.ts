import type {
  DecodedTransaction,
  DecodeTransactionParams,
  LowLevelCall,
} from '@lit-protocol/vincent-ability-sdk/gatedSigner';
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
    return {
      args: df.args,
      kind,
      fn: df.functionName,
      to: transaction.to,
      value: transaction.value,
    };
  } catch (error) {
    console.log(`Not a valid Aave transaction: ${JSON.stringify(error)}`);
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

  return (
    aaveTransaction ||
    erc20Transaction || { kind: 'error', message: 'Unknown transaction type. Could not decode' }
  );
};
