import type { Hex, SignableMessage, TransactionSerializable } from 'viem';

import {
  hashMessage,
  hashTypedData,
  hexToBytes,
  keccak256,
  serializeSignature,
  serializeTransaction,
} from 'viem';
import { toAccount } from 'viem/accounts';
import { publicKeyToAddress } from 'viem/utils';

declare const Lit: {
  Actions: {
    signAndCombineEcdsa: (params: {
      toSign: Uint8Array;
      publicKey: string;
      sigName: string;
    }) => Promise<string>;
  };
};

interface LitActionSignature {
  r: string; // 02cb20a7ab19f830de23d24bfbdfe526b4415dac756d1f899087189eacb2b66aaf
  s: string; // 147a3a9f389097a2de387920757ce344934ef4cd5d6550621ef15664ddd69949
  v: 0 | 1; // 0
}

export function toLitActionAccount(pkpPublicKey: Hex) {
  const pkpEthAddress = publicKeyToAddress(pkpPublicKey);
  const pkpPublicKeyForLit = pkpPublicKey.replace('0x', '');

  return toAccount({
    address: pkpEthAddress,

    async signMessage({ message }: { message: SignableMessage }) {
      const hashedMessage = hashMessage(message);
      const signature = await Lit.Actions.signAndCombineEcdsa({
        toSign: hexToBytes(hashedMessage),
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

    async signTransaction(transaction, { serializer } = {}) {
      const signableTransaction = {
        ...transaction,
        chainId: transaction.chainId ? Number(transaction.chainId) : undefined,
      } as TransactionSerializable;
      const serializerToUse = serializer || serializeTransaction;
      const serializedTx = (await serializerToUse(signableTransaction)) as Hex;

      const txHash = keccak256(serializedTx);
      const toSign = hexToBytes(txHash);

      const signature = await Lit.Actions.signAndCombineEcdsa({
        toSign,
        publicKey: pkpPublicKeyForLit,
        sigName: 'signTransaction',
      });
      const structuredSignature = JSON.parse(signature) as LitActionSignature;

      return serializerToUse(signableTransaction, {
        r: `0x${structuredSignature.r.substring(2)}` as Hex,
        s: `0x${structuredSignature.s}` as Hex,
        v: BigInt(structuredSignature.v + 27),
      });
    },

    async signTypedData(typedData) {
      const { domain, types, primaryType, message } = typedData;
      const hashedTypedData = hashTypedData({
        domain,
        types,
        primaryType,
        message,
      } as any);

      const signature = await Lit.Actions.signAndCombineEcdsa({
        toSign: hexToBytes(hashedTypedData),
        publicKey: pkpPublicKeyForLit,
        sigName: 'signTypedData',
      });
      const structuredSignature = JSON.parse(signature) as LitActionSignature;

      return serializeSignature({
        r: `0x${structuredSignature.r.substring(2)}` as Hex,
        s: `0x${structuredSignature.s}` as Hex,
        yParity: structuredSignature.v,
      });
    },
  });
}
