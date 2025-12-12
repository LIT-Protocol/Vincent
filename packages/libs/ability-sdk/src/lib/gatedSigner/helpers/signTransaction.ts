import type { Hex } from 'viem';

import { concatHex, hexToBigInt, hexToNumber, parseTransaction } from 'viem';

import type { Transaction } from './transaction';

import { toLitActionAccount } from './toLitActionAccount';

interface SignTransactionParams {
  pkpPublicKey: Hex;
  transaction: Transaction;
}

export async function signTransaction({ pkpPublicKey, transaction }: SignTransactionParams) {
  const account = toLitActionAccount(pkpPublicKey);

  const signableTransaction = {
    ...transaction,
    accessList: transaction.accessList || [],
    gas: transaction.gas ? hexToBigInt(transaction.gas) : undefined,
    gasLimit: transaction.gasLimit ? hexToBigInt(transaction.gasLimit) : undefined,
    gasPrice: transaction.gasPrice ? hexToBigInt(transaction.gasPrice) : undefined,
    maxFeePerGas: transaction.maxFeePerGas ? hexToBigInt(transaction.maxFeePerGas) : undefined,
    maxPriorityFeePerGas: transaction.maxPriorityFeePerGas
      ? hexToBigInt(transaction.maxPriorityFeePerGas)
      : undefined,
    nonce: hexToNumber(transaction.nonce),
    value: hexToBigInt(transaction.value),
  };

  // @ts-expect-error viem complains but the tx should be coherent besides generalities
  const signedTx = await account.signTransaction(signableTransaction);
  const parsed = parseTransaction(signedTx);
  if (!parsed.r || !parsed.s || parsed.yParity === undefined)
    throw new Error('Signed tx missing signature fields');

  const yParityByte = parsed.yParity === 0 ? '0x00' : '0x01';

  const signature = concatHex([parsed.r, parsed.s, yParityByte]);

  return signature;
}
