import { AbstractEthersV5Signer } from '@nktkas/hyperliquid/signing';
import { ethers } from 'ethers';

/**
 * LitActionPkpEthersWallet - An ethers-compatible wallet implementation for use within Lit Actions
 *
 * This class provides an ethers.js Signer-compatible interface that uses Lit's PKP signing
 * capabilities within a Lit Action execution environment. Unlike PKPEthersWallet which is
 * designed to run outside Lit Actions and uses the Lit SDK to make signing requests,
 * this wallet runs INSIDE a Lit Action and directly calls Lit.Actions.signAndCombineEcdsa.
 *
 * Key differences from PKPEthersWallet:
 * - No provider/RPC logic (runs in Lit Action sandbox)
 * - Direct use of Lit.Actions.signAndCombineEcdsa instead of SDK methods
 * - Simplified constructor (just takes PKP public key)
 * - No transaction population (gas estimation, nonce, etc.)
 *
 * Supports:
 * - signMessage: Sign arbitrary messages (EIP-191)
 * - _signTypedData: Sign EIP-712 typed data
 * - signTransaction: Sign raw Ethereum transactions
 *
 * @example
 * ```typescript
 * const wallet = new LitActionPkpEthersWallet({
 *   pkpPublicKey: '0x04...',
 *   sigName: 'my-signature'
 * });
 *
 * // Sign a message
 * const signature = await wallet.signMessage('Hello World');
 *
 * // Sign typed data (EIP-712)
 * const typedSignature = await wallet._signTypedData(domain, types, value);
 *
 * // Sign a transaction
 * const signedTx = await wallet.signTransaction(transaction);
 * ```
 */
export class LitActionPkpEthersWallet implements AbstractEthersV5Signer {
  private readonly pkpPublicKey: string;
  private readonly sigName: string;
  public readonly address: string;

  constructor(pkpPublicKey: string, sigName = 'pkp-ethers-signature') {
    const cleanedKey = pkpPublicKey.replace(/^0x/i, '');

    if (!/^[0-9a-fA-F]{130}$/.test(cleanedKey)) {
      throw new Error(
        `Invalid PKP public key format: expected 130 hex characters (uncompressed), got ${cleanedKey.length} chars`,
      );
    }

    this.pkpPublicKey = cleanedKey.toLowerCase();
    this.sigName = sigName;
    this.address = ethers.utils.computeAddress('0x' + this.pkpPublicKey);
  }

  /**
   * Sign a message using EIP-191 personal_sign format
   */
  async signMessage(message: string | Uint8Array): Promise<string> {
    // Use ethers' hashMessage which handles EIP-191 formatting
    const messageHash = ethers.utils.hashMessage(message);
    const toSign = ethers.utils.arrayify(messageHash);

    const signatureResponse = await Lit.Actions.signAndCombineEcdsa({
      toSign,
      publicKey: this.pkpPublicKey,
      sigName: this.sigName,
    });

    const parsedSig = JSON.parse(signatureResponse);

    return ethers.utils.joinSignature({
      r: normalizeSignatureComponent(parsedSig.r),
      s: normalizeSignatureComponent(parsedSig.s),
      v: parsedSig.v,
    });
  }

  /**
   * Get the wallet address (required by AbstractEthersV5Signer)
   */
  async getAddress(): Promise<string> {
    return this.address;
  }

  /**
   * Sign typed data using EIP-712 (required by AbstractEthersV5Signer)
   * Note: Ethers v5 uses _signTypedData (with underscore)
   */
  async _signTypedData(
    domain: {
      name: string;
      version: string;
      chainId: number;
      verifyingContract: string;
    },
    types: {
      [key: string]: {
        name: string;
        type: string;
      }[];
    },
    value: Record<string, unknown>,
  ): Promise<string> {
    if (!domain?.verifyingContract || !types || !value) {
      throw new Error('Invalid typed data parameters');
    }

    // Normalize value for deterministic serialization
    const normalizedValue = normalizeTypedDataValue(value, types);

    // Create EIP-712 hash
    const hash = ethers.utils._TypedDataEncoder.hash(domain, types, normalizedValue);
    const toSignBytes = ethers.utils.arrayify(hash);

    const signatureResponse = await Lit.Actions.signAndCombineEcdsa({
      toSign: toSignBytes,
      publicKey: this.pkpPublicKey,
      sigName: this.sigName,
    });

    const parsedSig = JSON.parse(signatureResponse);

    // Convert v from recovery id (0 or 1) to Ethereum format (27 or 28)
    const vEthereum = parsedSig.v === 0 || parsedSig.v === 1 ? parsedSig.v + 27 : parsedSig.v;

    return ethers.utils.joinSignature({
      r: normalizeSignatureComponent(parsedSig.r),
      s: normalizeSignatureComponent(parsedSig.s),
      v: vEthereum,
    });
  }

  /**
   * Sign a transaction
   * Note: Transaction must be pre-populated with all fields (gasLimit, nonce, chainId, etc.)
   * as we don't have RPC access in Lit Actions
   */
  async signTransaction(transaction: ethers.providers.TransactionRequest): Promise<string> {
    const tx = { ...transaction };
    delete tx.from; // ethers doesn't allow 'from' in unsigned tx

    const serializedTx = ethers.utils.serializeTransaction(tx as ethers.utils.UnsignedTransaction);
    const toSign = ethers.utils.arrayify(ethers.utils.keccak256(serializedTx));

    const signatureResponse = await Lit.Actions.signAndCombineEcdsa({
      toSign,
      publicKey: this.pkpPublicKey,
      sigName: this.sigName,
    });

    const parsedSig = JSON.parse(signatureResponse);

    return ethers.utils.serializeTransaction(tx as ethers.utils.UnsignedTransaction, {
      r: normalizeSignatureComponent(parsedSig.r),
      s: normalizeSignatureComponent(parsedSig.s),
      v: parsedSig.v,
    });
  }
}

/**
 * Normalize signature component (r or s) from Lit's signAndCombineEcdsa response
 * Lit returns signature components in DER encoding which may have a prefix byte
 */
function normalizeSignatureComponent(component: unknown): string {
  if (typeof component !== 'string') {
    throw new Error(`Invalid signature component type: expected string, got ${typeof component}`);
  }

  // Ensure hex string has 0x prefix for ethers utilities
  const hex = component.startsWith('0x') ? component : '0x' + component;
  const length = ethers.utils.hexDataLength(hex);

  // DER encoding has prefix byte, strip it
  if (length === 33) {
    return ethers.utils.hexDataSlice(hex, 1);
  } else if (length === 32) {
    return hex;
  } else {
    throw new Error(`Invalid signature component length: expected 32 or 33 bytes, got ${length}`);
  }
}

/**
 * Normalize typed data value to ensure deterministic serialization
 */
function normalizeTypedDataValue(
  value: Record<string, unknown>,
  types: { [key: string]: { name: string; type: string }[] },
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  const primaryType = Object.keys(types)[0];

  if (!primaryType || !types[primaryType]) {
    return value;
  }

  // Build normalized object in type definition order
  const fieldOrder = types[primaryType].map((f) => f.name);

  for (const fieldName of fieldOrder) {
    if (fieldName in value) {
      const fieldValue = value[fieldName];

      // Recursively normalize nested objects
      if (
        typeof fieldValue === 'object' &&
        fieldValue !== null &&
        !Array.isArray(fieldValue) &&
        !(fieldValue instanceof Uint8Array)
      ) {
        const fieldType = types[primaryType].find((f) => f.name === fieldName)?.type;
        if (fieldType && types[fieldType]) {
          normalized[fieldName] = normalizeTypedDataValue(
            fieldValue as Record<string, unknown>,
            types,
          );
        } else {
          normalized[fieldName] = fieldValue;
        }
      } else {
        normalized[fieldName] = fieldValue;
      }
    }
  }

  // Include any additional fields not in type definition
  for (const key of Object.keys(value)) {
    if (!(key in normalized)) {
      normalized[key] = value[key];
    }
  }

  return normalized;
}
