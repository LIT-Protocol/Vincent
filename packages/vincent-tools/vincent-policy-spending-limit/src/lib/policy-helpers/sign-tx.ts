import {
  keccak256,
  recoverTransactionAddress,
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
  console.log(`Signing tx: ${sigName} (signTx)`);

  const publicKeyForLit = pkpPublicKey.replace(/^0x/, '');
  console.log(`Signing using PKP Public Key: ${publicKeyForLit} (signTx)`);

  const unsignedSerializedTx = serializeTransaction(tx);
  const txHash = keccak256(toBytes(unsignedSerializedTx));

  console.log('unsignedSerializedTx (signTx)', unsignedSerializedTx);
  console.log('txHash (signTx)', txHash);

  const sigJson = await Lit.Actions.signAndCombineEcdsa({
    toSign: toBytes(txHash),
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

  const recoveredAddress = await recoverTransactionAddress({
    serializedTransaction: unsignedSerializedTx,
    signature,
  });
  console.log('Recovered address (signTx)', recoveredAddress);

  return serializeTransaction(tx, signature);
};
