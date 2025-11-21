import {
  type Address,
  type Hex,
  type TransactionSerializable,
  hexToBigInt,
  hexToBytes,
  keccak256,
  serializeSignature,
  serializeTransaction,
} from 'viem';

import { Transaction } from './transaction';

interface LitActionSignature {
  r: string;
  s: string;
  v: 0 | 1;
}

interface SignTransactionParams {
  pkpPublicKey: Hex;
  transaction: Transaction;
}

export interface SignTransactionResult {
  signature: Hex;
  signedTransaction: Hex;
}

export async function signTransaction({
  pkpPublicKey,
  transaction,
}: SignTransactionParams): Promise<SignTransactionResult> {
  const serializableTx = convertToSerializableTransaction(transaction);

  const unsignedSerializedTx = serializeTransaction(serializableTx);
  const txHashBytes = hexToBytes(keccak256(unsignedSerializedTx));

  const pkpPublicKeyForLit = pkpPublicKey.replace(/^0x/, '');
  const signatureResponse = await Lit.Actions.signAndCombineEcdsa({
    toSign: txHashBytes,
    publicKey: pkpPublicKeyForLit,
    sigName: 'signTransaction',
  });
  const structuredSignature = JSON.parse(signatureResponse) as LitActionSignature;

  const signatureComponents = {
    r: `0x${structuredSignature.r.substring(2)}` as Hex,
    s: `0x${structuredSignature.s}` as Hex,
    yParity: structuredSignature.v,
  };

  const signature = serializeSignature(signatureComponents);
  const signedTransaction = serializeTransaction(serializableTx, signatureComponents);

  return {
    signature,
    signedTransaction,
  };
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
