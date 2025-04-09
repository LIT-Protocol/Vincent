import { ethers } from "ethers";

export const signTx = async (
  pkpPublicKey: string,
  tx: ethers.Transaction,
  sigName: string
) => {
  console.log(`Signing tx: ${sigName}`);

  // Remove 0x prefix if it exists, Lit expects a hex string without 0x prefix
  const publicKeyForLit = pkpPublicKey.replace(/^0x/, '');
  console.log(`Signing using PKP Public Key: ${publicKeyForLit}...`);

  const sig = await Lit.Actions.signAndCombineEcdsa({
    toSign: ethers.utils.arrayify(
      ethers.utils.keccak256(ethers.utils.serializeTransaction(tx))
    ),
    publicKey: publicKeyForLit,
    sigName,
  });

  return ethers.utils.serializeTransaction(
    tx,
    ethers.utils.joinSignature({
      r: '0x' + JSON.parse(sig).r.substring(2),
      s: '0x' + JSON.parse(sig).s,
      v: JSON.parse(sig).v,
    })
  );
};