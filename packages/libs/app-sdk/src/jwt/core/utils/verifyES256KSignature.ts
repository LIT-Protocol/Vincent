import * as secp256k1 from '@noble/secp256k1';
import { ethers } from 'ethers';
import { arrayify, toUtf8Bytes } from 'ethers/lib/utils';

import type { AnyVincentJWT } from '../../types';

import { JWT_ERROR } from '../../constants';
import { fromBase64 } from './base64';

export async function verifyES256KSignature({ decoded }: { decoded: AnyVincentJWT }) {
  try {
    const { data, signature } = decoded;

    // Process signature from base64url to binary
    const signatureBytes = fromBase64(signature);

    // Extract r and s values from the signature
    const r = signatureBytes.slice(0, 32);
    const s = signatureBytes.slice(32, 64);

    const publicKeyBytes = arrayify(decoded.payload.publicKey);

    // PKPEthersWallet.signMessage() adds Ethereum prefix, so we need to add it here too
    const ethPrefixedMessage = '\x19Ethereum Signed Message:\n' + data.length + data;
    const messageHashBytes = arrayify(ethers.utils.keccak256(toUtf8Bytes(ethPrefixedMessage)));

    const signatureForSecp = new Uint8Array([...r, ...s]);

    // Verify the signature against the public key
    const isVerified = secp256k1.verify(signatureForSecp, messageHashBytes, publicKeyBytes);

    if (!isVerified) {
      throw new Error(`Signature verify() did not pass for ${signature}`);
    }
  } catch (error) {
    throw new Error(
      `${JWT_ERROR.INVALID_SIGNATURE}: Invalid signature: ${(error as Error).message}`
    );
  }
}
