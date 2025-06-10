import { ethers } from 'ethers';

declare const Lit: {
  Actions: {
    signAndCombineEcdsa: (params: {
      toSign: Uint8Array;
      publicKey: string;
      sigName: string;
    }) => Promise<string>;
  };
};

export const signTx = async (pkpPublicKey: string, tx: ethers.Transaction, sigName: string) => {
  console.log(`Signing tx (signTx): ${sigName}`);

  // Remove 0x prefix if it exists, Lit expects a hex string without 0x prefix
  const publicKeyForLit = pkpPublicKey.replace(/^0x/, '');
  console.log(`Signing using PKP Public Key: ${publicKeyForLit} (signTx)`);

  const unsignedSerializedTx = ethers.utils.serializeTransaction(tx);
  console.log('Unsigned serialized tx (signTx)', unsignedSerializedTx);

  const txHash = ethers.utils.keccak256(unsignedSerializedTx);
  console.log('Tx hash (signTx)', txHash);

  const signatureResponse = await Lit.Actions.signAndCombineEcdsa({
    toSign: ethers.utils.arrayify(txHash),
    publicKey: publicKeyForLit,
    sigName,
  });
  console.log('Signature (signTx)', signatureResponse);

  const { r, s, v } = JSON.parse(signatureResponse);
  const ethersJoinedSignature = ethers.utils.joinSignature({
    r: '0x' + r.substring(2),
    s: '0x' + s,
    v: v,
  });
  console.log('Ethers joined signature (signTx)', ethersJoinedSignature);

  const signedSerializedTx = ethers.utils.serializeTransaction(tx, ethersJoinedSignature);
  console.log('Signed serialized tx (signTx)', signedSerializedTx);

  return signedSerializedTx;
};
