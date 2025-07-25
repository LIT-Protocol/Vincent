import { ethers } from 'ethers';

interface SignatureFields {
  hash: string;
  from: string;
  v: number;
  r: string;
  s: string;
}

interface SerializedUnsignedTransaction {
  to: string;
  nonce?: number;
  gasLimit: string;
  gasPrice?: string;
  data: string;
  value: string;
  chainId: number;
  type?: number;
  accessList?: Array<{ address: string; storageKeys: string[] }>;
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
}

interface SerializedSignedTransaction extends SignatureFields {
  to: string;
  nonce: number;
  gasLimit: string;
  gasPrice?: string | null;
  data: string;
  value: string;
  chainId: number;
  type?: number | null;
  accessList?: Array<{ address: string; storageKeys: string[] }>;
  maxPriorityFeePerGas?: string | null;
  maxFeePerGas?: string | null;
}

/**
 * Serializes a parsed transaction to a format suitable for API responses (unsigned)
 */
/**
 * Adds optional transaction fields to the serialized object
 */
function addOptionalFields(
  serialized: SerializedUnsignedTransaction | SerializedSignedTransaction,
  transaction: ethers.Transaction,
): void {
  if (transaction.gasPrice !== undefined) {
    serialized.gasPrice = transaction.gasPrice.toHexString();
  }
  if (transaction.type !== null && transaction.type !== undefined) {
    serialized.type = transaction.type;
  }
  if (transaction.accessList !== undefined) {
    serialized.accessList = transaction.accessList;
  }
  if (transaction.maxPriorityFeePerGas !== undefined) {
    serialized.maxPriorityFeePerGas = transaction.maxPriorityFeePerGas.toHexString();
  }
  if (transaction.maxFeePerGas !== undefined) {
    serialized.maxFeePerGas = transaction.maxFeePerGas.toHexString();
  }
}

export function serializeTransactionForResponse(
  transaction: ethers.Transaction,
): SerializedUnsignedTransaction;

/**
 * Serializes a parsed transaction to a format suitable for API responses (signed)
 */
export function serializeTransactionForResponse(
  transaction: ethers.Transaction,
  signature: SignatureFields,
): SerializedSignedTransaction;

export function serializeTransactionForResponse(
  transaction: ethers.Transaction,
  signature?: SignatureFields,
): SerializedUnsignedTransaction | SerializedSignedTransaction {
  if (signature) {
    // Validate that 'to' address is provided (no contract deployment allowed)
    if (!transaction.to) {
      throw new Error(
        'Transaction must have a "to" address. Contract deployment transactions are not supported.',
      );
    }

    // Build signed transaction response
    const signedTx: SerializedSignedTransaction = {
      hash: signature.hash,
      to: transaction.to,
      from: signature.from,
      nonce: transaction.nonce,
      gasLimit: transaction.gasLimit.toHexString(),
      data: transaction.data,
      value: transaction.value.toHexString(),
      chainId: transaction.chainId,
      v: signature.v,
      r: signature.r,
      s: signature.s,
    };

    // Add optional fields
    addOptionalFields(signedTx, transaction);

    return signedTx;
  } else {
    // Validate that 'to' address is provided (no contract deployment allowed)
    if (!transaction.to) {
      throw new Error(
        'Transaction must have a "to" address. Contract deployment transactions are not supported.',
      );
    }

    // Build unsigned transaction response
    const unsignedTx: SerializedUnsignedTransaction = {
      to: transaction.to,
      gasLimit: transaction.gasLimit.toHexString(),
      data: transaction.data,
      value: transaction.value.toHexString(),
      chainId: transaction.chainId,
    };

    // Add optional fields
    if (transaction.nonce !== undefined) {
      unsignedTx.nonce = transaction.nonce;
    }
    addOptionalFields(unsignedTx, transaction);

    return unsignedTx;
  }
}
