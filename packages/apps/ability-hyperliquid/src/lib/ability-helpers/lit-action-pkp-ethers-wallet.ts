import { ethers } from 'ethers';

/**
 * Normalize typed data value to ensure deterministic serialization
 * This ensures that objects are serialized in a consistent order
 */
function normalizeTypedDataValue(
  value: Record<string, unknown>,
  types: { [key: string]: { name: string; type: string }[] },
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  // Get the primary type (first key in types)
  const primaryType = Object.keys(types)[0];
  if (!primaryType || !types[primaryType]) {
    return value;
  }

  // Sort fields by their order in the type definition
  const fieldOrder = types[primaryType].map((f) => f.name);

  // Build normalized object in the order defined by the type
  for (const fieldName of fieldOrder) {
    if (fieldName in value) {
      const fieldValue = value[fieldName];
      // Handle nested objects recursively if needed
      if (
        typeof fieldValue === 'object' &&
        fieldValue !== null &&
        !Array.isArray(fieldValue) &&
        !(fieldValue instanceof Uint8Array)
      ) {
        // Check if this field type is defined in types
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

  // Include any additional fields not in the type definition (shouldn't happen but be safe)
  for (const key of Object.keys(value)) {
    if (!(key in normalized)) {
      normalized[key] = value[key];
    }
  }

  return normalized;
}

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
export class LitActionPkpEthersWallet {
  private readonly pkpPublicKey: string;
  private readonly sigName: string;
  public readonly address: string;

  constructor(pkpPublicKey: string, sigName = 'hyperliquidTypedData') {
    // Ensure public key is in the correct format (no 0x prefix)
    // PKP public keys are uncompressed (130 hex chars = 65 bytes: 0x04 + 32 bytes x + 32 bytes y)
    const cleanedKey = pkpPublicKey.replace(/^0x/, '').replace(/^0X/, '');

    // Validate public key format - accept uncompressed format (130 hex chars)
    // Lit Actions expects the full uncompressed public key without 0x prefix
    if (!/^[0-9a-fA-F]{130}$/.test(cleanedKey)) {
      throw new Error(
        `Invalid PKP public key format: expected 130 hex characters (uncompressed), got ${cleanedKey.length} chars`,
      );
    }

    this.pkpPublicKey = cleanedKey.toLowerCase();
    this.sigName = sigName;
    // Compute Ethereum address from public key (ethers handles uncompressed format)
    this.address = ethers.utils.computeAddress('0x' + this.pkpPublicKey);

    console.log('[LitActionPkpEthersWallet] Initialized', {
      pkpPublicKey: this.pkpPublicKey.slice(0, 20) + '...',
      address: this.address,
    });
  }

  /**
   * Sign a message (required for L1 actions)
   */
  async signMessage(message: string | Uint8Array): Promise<string> {
    let messageBytes: Uint8Array;

    if (typeof message === 'string') {
      // If it's a hex string, parse it; otherwise treat as UTF-8
      if (message.startsWith('0x')) {
        messageBytes = ethers.utils.arrayify(message);
      } else {
        messageBytes = ethers.utils.toUtf8Bytes(message);
      }
    } else {
      messageBytes = message;
    }

    // For L1 actions, Hyperliquid signs the raw message bytes directly (not hashed)
    // But we need to ensure it's exactly 32 bytes for ECDSA signing
    // If it's not 32 bytes, hash it first
    let toSign: Uint8Array;
    if (messageBytes.length === 32) {
      toSign = messageBytes;
    } else {
      // Hash the message if it's not 32 bytes
      const messageHash = ethers.utils.keccak256(messageBytes);
      toSign = ethers.utils.arrayify(messageHash);
    }

    console.log('[LitActionPkpEthersWallet] signMessage called', {
      messageLength: messageBytes.length,
      toSignLength: toSign.length,
      isHexString: typeof message === 'string' && message.startsWith('0x'),
    });

    // Validate inputs
    if (toSign.length !== 32) {
      throw new Error(
        `Invalid message length: expected 32 bytes after processing, got ${toSign.length}`,
      );
    }

    if (!this.pkpPublicKey || this.pkpPublicKey.length !== 130) {
      throw new Error(
        `Invalid public key length: expected 130 hex chars (uncompressed), got ${this.pkpPublicKey?.length || 0}`,
      );
    }

    // Sign using Lit's PKP signing
    const signatureResponse = await Lit.Actions.signAndCombineEcdsa({
      toSign: toSign,
      publicKey: this.pkpPublicKey,
      sigName: this.sigName,
    });

    const parsedSig = JSON.parse(signatureResponse);

    // Normalize r and s to 32-byte values (64 hex chars + "0x" prefix = 66 total)
    // Lit returns r/s in variable formats - we need to handle them correctly
    let rValue = parsedSig.r;
    if (typeof rValue === 'string') {
      // Remove "0x" prefix if present
      let cleanR = rValue.replace(/^0x/i, '');

      // If cleanR is 66 chars, we need to strip the first 2 chars (1 byte)
      // This matches the reference: r.substring(2) when r has "0x" prefix
      if (cleanR.length === 66) {
        cleanR = cleanR.substring(2);
      } else if (cleanR.length !== 64) {
        throw new Error(`Invalid r length: expected 64 or 66 hex chars, got ${cleanR.length}`);
      }

      rValue = '0x' + cleanR;
    } else {
      throw new Error(`Invalid r type: expected string, got ${typeof rValue}`);
    }

    let sValue = parsedSig.s;
    if (typeof sValue === 'string') {
      // Remove "0x" prefix if present
      let cleanS = sValue.replace(/^0x/i, '');

      // s should typically be 64 chars, but handle 66 just in case
      if (cleanS.length === 66) {
        cleanS = cleanS.substring(2);
      } else if (cleanS.length !== 64) {
        throw new Error(`Invalid s length: expected 64 or 66 hex chars, got ${cleanS.length}`);
      }

      sValue = '0x' + cleanS;
    } else {
      throw new Error(`Invalid s type: expected string, got ${typeof sValue}`);
    }

    // Use v directly - based on reference implementation
    // The reference (ability-aerodrome-swap) uses v as-is without conversion
    const vValue = parsedSig.v;

    console.log('[LitActionPkpEthersWallet] Before joinSignature', {
      r: rValue,
      s: sValue,
      v: vValue,
      rLength: rValue.length,
      sLength: sValue.length,
    });

    // Join signature components and return as string (ethers v5 format)
    const signature = ethers.utils.joinSignature({
      r: rValue,
      s: sValue,
      v: vValue,
    });

    // Recover address from signature for debugging
    try {
      const messageHash = ethers.utils.hashMessage(message);
      const recoveredAddress = ethers.utils.recoverAddress(messageHash, signature);
      console.log('[LitActionPkpEthersWallet] signMessage - Signature recovery check', {
        recoveredAddress,
        expectedAddress: this.address,
        match: recoveredAddress.toLowerCase() === this.address.toLowerCase(),
        signature,
      });
    } catch (error) {
      console.error(
        '[LitActionPkpEthersWallet] signMessage - Could not verify signature recovery',
        error,
      );
    }

    return signature;
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
    console.log('[LitActionPkpEthersWallet] _signTypedData called', {
      domain,
      primaryType: Object.keys(types)[0],
      typesKeys: Object.keys(types),
      valueKeys: Object.keys(value || {}),
      value: JSON.stringify(value),
    });

    // Validate inputs
    if (!domain || !types || !value) {
      throw new Error('Invalid typed data parameters: domain, types, and value must be provided');
    }

    if (!domain.verifyingContract || typeof domain.verifyingContract !== 'string') {
      throw new Error(`Invalid verifyingContract: ${domain.verifyingContract}`);
    }

    // Normalize the value object to ensure deterministic serialization
    // This handles cases where objects might have non-deterministic property ordering
    const normalizedValue = normalizeTypedDataValue(value, types);

    // Create the EIP-712 hash using ethers
    let hash: string;
    try {
      hash = ethers.utils._TypedDataEncoder.hash(domain, types, normalizedValue);
    } catch (error) {
      console.error('[LitActionPkpEthersWallet] Error creating EIP-712 hash', error);
      throw new Error(
        `Failed to create EIP-712 hash: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    console.log('[LitActionPkpEthersWallet] EIP-712 hash', hash);

    // Validate inputs
    if (!hash || typeof hash !== 'string') {
      throw new Error('Invalid hash from _TypedDataEncoder.hash');
    }

    const toSignBytes = ethers.utils.arrayify(hash);
    if (toSignBytes.length !== 32) {
      throw new Error(`Invalid hash length: expected 32 bytes, got ${toSignBytes.length}`);
    }

    if (!this.pkpPublicKey || this.pkpPublicKey.length !== 130) {
      throw new Error(
        `Invalid public key length: expected 130 hex chars (uncompressed), got ${this.pkpPublicKey?.length || 0}`,
      );
    }

    console.log('[LitActionPkpEthersWallet] Signing with', {
      toSignLength: toSignBytes.length,
      publicKeyLength: this.pkpPublicKey.length,
      sigName: this.sigName,
    });

    // Sign using Lit's PKP signing
    const signatureResponse = await Lit.Actions.signAndCombineEcdsa({
      toSign: toSignBytes,
      publicKey: this.pkpPublicKey,
      sigName: this.sigName,
    });

    const parsedSig = JSON.parse(signatureResponse);
    console.log('[LitActionPkpEthersWallet] Parsed signature', {
      r: parsedSig.r,
      s: parsedSig.s,
      v: parsedSig.v,
      rType: typeof parsedSig.r,
      sType: typeof parsedSig.s,
    });

    // Normalize r and s to 32-byte values (64 hex chars + "0x" prefix = 66 total)
    // Lit returns r/s in variable formats - we need to handle them correctly
    let rValue = parsedSig.r;
    if (typeof rValue === 'string') {
      // Remove "0x" prefix if present
      let cleanR = rValue.replace(/^0x/i, '');

      // If cleanR is 66 chars, we need to strip the first 2 chars (1 byte)
      // This matches the reference: r.substring(2) when r has "0x" prefix
      if (cleanR.length === 66) {
        cleanR = cleanR.substring(2);
      } else if (cleanR.length !== 64) {
        throw new Error(`Invalid r length: expected 64 or 66 hex chars, got ${cleanR.length}`);
      }

      rValue = '0x' + cleanR;
    } else {
      throw new Error(`Invalid r type: expected string, got ${typeof rValue}`);
    }

    let sValue = parsedSig.s;
    if (typeof sValue === 'string') {
      // Remove "0x" prefix if present
      let cleanS = sValue.replace(/^0x/i, '');

      // s should typically be 64 chars, but handle 66 just in case
      if (cleanS.length === 66) {
        cleanS = cleanS.substring(2);
      } else if (cleanS.length !== 64) {
        throw new Error(`Invalid s length: expected 64 or 66 hex chars, got ${cleanS.length}`);
      }

      sValue = '0x' + cleanS;
    } else {
      throw new Error(`Invalid s type: expected string, got ${typeof sValue}`);
    }

    // Use v directly - based on reference implementation
    // The reference (ability-aerodrome-swap) uses v as-is without conversion
    const vValue = parsedSig.v;

    // Convert v from recovery id (0 or 1) to Ethereum format (27 or 28)
    // This is required for proper signature verification
    let vEthereum = vValue;
    if (vValue === 0 || vValue === 1) {
      vEthereum = vValue + 27;
    }

    console.log('[LitActionPkpEthersWallet] Before joinSignature', {
      r: rValue,
      s: sValue,
      vOriginal: vValue,
      vEthereum: vEthereum,
      rLength: rValue.length,
      sLength: sValue.length,
    });

    // Use joinSignature with the Ethereum v value
    const signature = ethers.utils.joinSignature({
      r: rValue,
      s: sValue,
      v: vEthereum,
    });

    console.log('[LitActionPkpEthersWallet] Final signature', {
      signature,
      r: rValue,
      s: sValue,
      v: vEthereum,
    });

    // Verify the signature can recover to the expected address
    // This helps catch signature format issues early
    try {
      const recoveredAddress = ethers.utils.recoverAddress(hash, signature);
      const expectedAddress = this.address;
      console.log('[LitActionPkpEthersWallet] Signature recovery check', {
        recoveredAddress,
        expectedAddress,
        match: recoveredAddress.toLowerCase() === expectedAddress.toLowerCase(),
      });
      if (recoveredAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
        console.error('[LitActionPkpEthersWallet] WARNING: Signature recovery mismatch!', {
          recoveredAddress,
          expectedAddress,
          hash,
          signature,
        });
      }
    } catch (error) {
      console.error('[LitActionPkpEthersWallet] Could not verify signature recovery', error);
    }

    return signature;
  }

  /**
   * Sign a transaction
   * Based on PKPEthersWallet.signTransaction but simplified for Lit Action environment
   *
   * Note: This method expects the transaction to already be populated with all necessary
   * fields (gasLimit, nonce, chainId, etc.) since we don't have RPC access in Lit Actions.
   */
  async signTransaction(transaction: ethers.providers.TransactionRequest): Promise<string> {
    console.log('[LitActionPkpEthersWallet] signTransaction called', { transaction });

    // Remove 'from' field if present (ethers doesn't allow it in unsigned tx)
    const tx = { ...transaction };
    if (tx.from) {
      delete tx.from;
    }

    // Serialize the transaction to get the signing hash
    const serializedTx = ethers.utils.serializeTransaction(tx as ethers.utils.UnsignedTransaction);
    const unsignedTxHash = ethers.utils.keccak256(serializedTx);
    const toSign = ethers.utils.arrayify(unsignedTxHash);

    console.log('[LitActionPkpEthersWallet] Transaction hash to sign', {
      hash: unsignedTxHash,
      toSignLength: toSign.length,
    });

    // Sign using Lit's PKP signing
    const signatureResponse = await Lit.Actions.signAndCombineEcdsa({
      toSign: toSign,
      publicKey: this.pkpPublicKey,
      sigName: this.sigName,
    });

    const parsedSig = JSON.parse(signatureResponse);

    // Normalize r and s
    let rValue = parsedSig.r;
    if (typeof rValue === 'string') {
      rValue = '0x' + rValue.replace(/^0x/i, '');
      if (rValue.length !== 66) {
        throw new Error(`Invalid r length: expected 66 hex chars (with 0x), got ${rValue.length}`);
      }
    } else {
      throw new Error(`Invalid r type: expected string, got ${typeof rValue}`);
    }

    let sValue = parsedSig.s;
    if (typeof sValue === 'string') {
      sValue = '0x' + sValue.replace(/^0x/i, '');
      if (sValue.length !== 66) {
        throw new Error(`Invalid s length: expected 66 hex chars (with 0x), got ${sValue.length}`);
      }
    } else {
      throw new Error(`Invalid s type: expected string, got ${typeof sValue}`);
    }

    // Validate v is 27 or 28
    if (parsedSig.v !== 27 && parsedSig.v !== 28) {
      throw new Error(`Invalid v value: expected 27 or 28, got ${parsedSig.v}`);
    }

    // Create the signature object
    const signature = {
      r: rValue,
      s: sValue,
      v: parsedSig.v,
    };

    // Serialize the signed transaction
    const signedTx = ethers.utils.serializeTransaction(
      tx as ethers.utils.UnsignedTransaction,
      signature,
    );

    console.log('[LitActionPkpEthersWallet] Transaction signed', {
      signature,
      signedTx,
    });

    return signedTx;
  }
}
