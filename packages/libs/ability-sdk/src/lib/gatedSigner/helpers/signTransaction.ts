import type { Address, Hex, TransactionSerializable } from 'viem';

import { hexToBigInt } from 'viem';

import type { Transaction } from './transaction';

import { toLitActionAccount } from './toLitActionAccount';

interface SignTransactionParams {
  pkpPublicKey: Hex;
  transaction: Transaction;
}

export async function signTransaction({ pkpPublicKey, transaction }: SignTransactionParams) {
  const serializableTx = convertToSerializableTransaction(transaction);

  const account = toLitActionAccount(pkpPublicKey);

  return await account.signTransaction(serializableTx);
}

function convertToSerializableTransaction(transaction: Transaction): TransactionSerializable {
  const value = hexToBigInt(transaction.value);
  const gasHex = transaction.gas ?? transaction.gasLimit;
  const gas = hexToBigInt(gasHex!); // We know it exists due to schema validation

  const chainId =
    typeof transaction.chainId === 'number'
      ? transaction.chainId
      : Number(hexToBigInt(transaction.chainId));

  const nonce = Number(hexToBigInt(transaction.nonce));

  // Determine transaction type and fee values
  let type: 'legacy' | 'eip1559';
  let feeValues: { gasPrice?: bigint; maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint };

  if (transaction.gasPrice) {
    type = 'legacy';
    feeValues = {
      gasPrice: hexToBigInt(transaction.gasPrice),
    };
  } else {
    // We know both exist due to schema validation
    type = 'eip1559';
    feeValues = {
      maxFeePerGas: hexToBigInt(transaction.maxFeePerGas!),
      maxPriorityFeePerGas: hexToBigInt(transaction.maxPriorityFeePerGas!),
    };
  }

  return {
    chainId,
    nonce,
    gas,
    to: transaction.to as Address,
    data: transaction.data,
    value,
    accessList: transaction.accessList,
    ...feeValues,
    type,
  } as TransactionSerializable;
}
