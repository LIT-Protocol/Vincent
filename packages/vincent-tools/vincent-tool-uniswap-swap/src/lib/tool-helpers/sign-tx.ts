import {
  keccak256,
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

  const serializedTx = serializeTransaction(tx);
  const txHash = keccak256(toBytes(serializedTx));

  const sigJson = await Lit.Actions.signAndCombineEcdsa({
    toSign: toBytes(txHash),
    publicKey: publicKeyForLit,
    sigName,
  });

  const parsed = JSON.parse(sigJson);
  const { r, s, v } = parsed;

  const yParity = Number(v) % 2; // Convert ECDSA `v` to yParity (0 or 1)

  const signature: Signature = {
    r: r as `0x${string}`,
    s: s as `0x${string}`,
    yParity,
  };

  return serializeTransaction(tx, signature);
};
