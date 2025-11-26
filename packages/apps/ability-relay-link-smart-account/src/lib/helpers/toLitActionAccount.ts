import { hashMessage, Hex, serializeSignature, SignableMessage } from 'viem';
import { toAccount } from 'viem/accounts';

interface LitActionSignature {
  r: string; // 02cb20a7ab19f830de23d24bfbdfe526b4415dac756d1f899087189eacb2b66aaf
  s: string; // 147a3a9f389097a2de387920757ce344934ef4cd5d6550621ef15664ddd69949
  v: 0 | 1; // 0
}

export function toLitActionAccount(pkpPublicKey: Hex) {
  const pkpEthAddress = ethers.utils.computeAddress(pkpPublicKey) as Hex;
  const pkpPublicKeyForLit = pkpPublicKey.replace('0x', '');

  return toAccount({
    address: pkpEthAddress,

    async signMessage({ message }: { message: SignableMessage }) {
      const hashedMessage = hashMessage(message);
      const signature = await Lit.Actions.signAndCombineEcdsa({
        toSign: ethers.utils.arrayify(hashedMessage),
        publicKey: pkpPublicKeyForLit,
        sigName: 'signMessage',
      });
      const structuredSignature = JSON.parse(signature) as LitActionSignature;

      return serializeSignature({
        r: `0x${structuredSignature.r.substring(2)}` as Hex,
        s: `0x${structuredSignature.s}` as Hex,
        yParity: structuredSignature.v,
      });
    },

    async signTransaction() {
      throw new Error('Not implemented');
    },

    async signTypedData() {
      throw new Error('Not implemented');
    },
  });
}
