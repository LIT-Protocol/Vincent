import { ethers } from 'ethers';

/**
 * Builds a clean transaction object for signing, including only defined optional fields
 */
export function buildTransactionForSigning(transaction: ethers.Transaction): ethers.Transaction {
  const txToSign: ethers.Transaction = {
    to: transaction.to,
    nonce: transaction.nonce,
    gasLimit: transaction.gasLimit,
    gasPrice: transaction.gasPrice,
    data: transaction.data,
    value: transaction.value,
    chainId: transaction.chainId,
  };

  // Only include optional properties if they are defined
  if (transaction.type !== null && transaction.type !== undefined) {
    txToSign.type = transaction.type;
  }
  if (transaction.accessList !== undefined) {
    txToSign.accessList = transaction.accessList;
  }
  if (transaction.maxPriorityFeePerGas !== undefined) {
    txToSign.maxPriorityFeePerGas = transaction.maxPriorityFeePerGas;
  }
  if (transaction.maxFeePerGas !== undefined) {
    txToSign.maxFeePerGas = transaction.maxFeePerGas;
  }

  return txToSign;
}
