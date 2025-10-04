import type { UnsignedTransaction } from 'ethers';

import { VoidSigner, JsonRpcProvider, toQuantity, toNumber } from 'ethers-v6';

export const populateTransaction = async ({
  to,
  from,
  data,
  value,
  rpcUrl,
  chainId,
  gasBufferPercentage,
  baseFeePerGasBufferPercentage,
}: {
  to: string;
  from: string;
  data: string;
  value: string;
  rpcUrl: string;
  chainId?: number;
  gasBufferPercentage?: number;
  baseFeePerGasBufferPercentage?: number;
}): Promise<UnsignedTransaction> => {
  if (gasBufferPercentage !== undefined && !Number.isInteger(gasBufferPercentage)) {
    throw new Error('[populateTransaction] gasBufferPercentage must be an integer');
  }
  if (
    baseFeePerGasBufferPercentage !== undefined &&
    !Number.isInteger(baseFeePerGasBufferPercentage)
  ) {
    throw new Error('[populateTransaction] baseFeePerGasBufferPercentage must be an integer');
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new VoidSigner(from, provider);

  const populatedTx = await signer.populateTransaction({
    to,
    from,
    data,
    value,
    chainId,
  });

  if (!populatedTx.gasLimit) {
    throw new Error(
      `[estimateGas] Unable to estimate gas for transaction: ${JSON.stringify({
        to,
        from,
        data,
        value,
      })}`,
    );
  }

  if (gasBufferPercentage !== undefined) {
    populatedTx.gasLimit =
      (BigInt(populatedTx.gasLimit) * BigInt(100 + gasBufferPercentage)) / 100n;
  }

  const partialUnsignedTx: UnsignedTransaction = {
    to: populatedTx.to ?? undefined,
    nonce: populatedTx.nonce ?? undefined,

    gasLimit: toQuantity(populatedTx.gasLimit),

    data: populatedTx.data ?? undefined,
    value: populatedTx.value ? toQuantity(populatedTx.value) : '0x0',
    chainId: populatedTx.chainId ? toNumber(populatedTx.chainId) : undefined,

    // Typed-Transaction features
    type: populatedTx.type ?? undefined,

    // EIP-2930; Type 1 & EIP-1559; Type 2
    accessList: populatedTx.accessList ?? undefined,
  };

  // Legacy fee path
  if (populatedTx.gasPrice != null) {
    return {
      ...partialUnsignedTx,
      gasPrice: toQuantity(populatedTx.gasPrice),
    };
  }

  // EIP-1559 path
  if (populatedTx.maxFeePerGas == null) {
    throw new Error('[estimateGas] maxFeePerGas is missing from populated transaction');
  }
  if (populatedTx.maxPriorityFeePerGas == null) {
    throw new Error('[estimateGas] maxPriorityFeePerGas is missing from populated transaction');
  }

  if (baseFeePerGasBufferPercentage !== undefined) {
    // Apply baseFeePerGas buffer (e.g. 20% -> multiply by 1.2)
    populatedTx.maxFeePerGas =
      (BigInt(populatedTx.maxFeePerGas) * BigInt(100 + baseFeePerGasBufferPercentage)) / 100n;
  }

  return {
    ...partialUnsignedTx,
    maxFeePerGas: toQuantity(populatedTx.maxFeePerGas),
    maxPriorityFeePerGas: toQuantity(populatedTx.maxPriorityFeePerGas),
  };
};
