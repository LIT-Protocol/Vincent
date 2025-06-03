import {
  keccak256,
  recoverAddress,
  recoverTransactionAddress,
  serializeSignature,
  serializeTransaction,
  Signature,
  toBytes,
  TransactionSerializableEIP1559,
} from 'viem';

declare const Lit: {
  Actions: {
    signAndCombineEcdsa: (params: {
      toSign: Uint8Array;
      publicKey: string;
      sigName: string;
    }) => Promise<string>;
  };
};

export const signTx = async ({
  pkpPublicKey,
  tx,
  sigName,
}: {
  pkpPublicKey: string;
  tx: TransactionSerializableEIP1559;
  sigName: string;
}): Promise<`0x${string}`> => {
  console.log(`Signing tx: ${sigName} (signTx)`, {
    tx: {
      ...tx,
      value: tx.value?.toString(),
      gas: tx.gas?.toString(),
      maxFeePerGas: tx.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
    },
  });

  const publicKeyForLit = pkpPublicKey.replace(/^0x/, '');
  console.log(`Signing using PKP Public Key: ${publicKeyForLit} (signTx)`);

  const unsignedSerializedTx = serializeTransaction(tx);
  const txHash = keccak256(toBytes(unsignedSerializedTx));

  console.log('unsignedSerializedTx (signTx)', unsignedSerializedTx);
  console.log('txHash (signTx)', txHash);

  const sigJson = await Lit.Actions.signAndCombineEcdsa({
    toSign: toBytes(txHash),
    // toSign: toBytes(keccak256(toBytes('foo'))),
    publicKey: publicKeyForLit,
    sigName,
  });

  console.log(`Signature: ${sigJson} (signTx)`);

  const parsed = JSON.parse(sigJson);
  const { r, s, v } = parsed;
  console.log('Parsed signature (signTx)', { r, s, v });

  const signature: Signature = {
    r: ('0x' + r.substring(2)) as `0x${string}`,
    s: ('0x' + s) as `0x${string}`,
    v,
  };
  console.log('Viem formatted signature (signTx)', signature);

  const recoveredAddressFromTx = await recoverTransactionAddress({
    serializedTransaction: unsignedSerializedTx,
    signature,
  });
  console.log('Recovered address from transaction (signTx)', recoveredAddressFromTx);

  const viemSerializedTx = serializeTransaction(tx, signature);
  console.log('Viem serialized tx (signTx)', viemSerializedTx);

  // @ts-expect-error Debug
  const ethersSerializedTx = ethers.utils.serializeTransaction(
    {
      to: tx.to,
      data: tx.data,
      // @ts-expect-error Debug
      value: ethers.BigNumber.from(0),
      // @ts-expect-error Debug
      gasLimit: ethers.BigNumber.from(tx.gas?.toString()),
      // @ts-expect-error Debug
      maxFeePerGas: ethers.BigNumber.from(tx.maxFeePerGas?.toString()),
      // @ts-expect-error Debug
      maxPriorityFeePerGas: ethers.BigNumber.from(tx.maxPriorityFeePerGas?.toString()),
      nonce: tx.nonce,
      // @ts-expect-error Debug
      chainId: ethers.BigNumber.from(tx.chainId?.toString()).toNumber(),
      type: 2,
    },
    // @ts-expect-error Debug
    ethers.utils.joinSignature(signature),
  );
  console.log('Ethers serialized tx (signTx)', ethersSerializedTx);

  // @ts-expect-error Debug
  const ethersRecoveredAddress = ethers.utils.recoverAddress(
    txHash,
    // @ts-expect-error Debug
    ethers.utils.joinSignature(signature),
  );
  console.log('Ethers recovered address (signTx)', ethersRecoveredAddress);

  // return ethersSerializedTx;
  return viemSerializedTx;
};
