declare const ethers: {
  utils: {
    hashMessage: (message: string | Uint8Array<ArrayBufferLike>) => string;
    arrayify: (message: string) => Uint8Array;
    computeAddress: (publicKey: string) => string;
    joinSignature: (signature: { r: string; s: string; v: bigint }) => string;
    _TypedDataEncoder: {
      hash: (domain: any, types: any, message: any) => string;
    };
    keccak256: (data: string) => string;
    hexConcat: (data: string[]) => string;
    hexlify: (data: string | number | bigint) => string;
    RLP: {
      encode: (data: any[]) => string;
    };
  };
};

declare const Lit: {
  Actions: {
    signAndCombineEcdsa: (params: {
      toSign: Uint8Array;
      publicKey: string;
      sigName: string;
    }) => Promise<string>;
  };
};

/**
 * LitActionsSmartSigner for EIP-7702 delegated transactions
 *
 * This signer implements the Alchemy SmartAccountSigner interface to support
 * EIP-7702 delegation with the Lit Protocol PKP. It enables gasless transactions
 * through integration with Alchemy's gas sponsorship.
 *
 * @example
 * ```typescript
 * const signer = new LitActionsSmartSigner({
 *   pkpPublicKey,
 *   chainId,
 * });
 *
 * // Use with Alchemy's Smart Account Client, and pass as the signer.
 * ```
 */
export interface LitActionsSmartSignerConfig {
  pkpPublicKey: string;
  chainId: number;
}

// Type definitions compatible with Alchemy SDK and viem
type Address = `0x${string}`;
type Hex = `0x${string}`;

// SignableMessage from viem - can be string or object with raw property
type SignableMessage =
  | string
  | {
      raw: Hex | Uint8Array;
    };

// TypedDataDefinition compatible with viem
type TypedDataDefinition = {
  domain?: any;
  types?: any;
  primaryType?: string;
  message?: any;
};

// EIP-7702 types
type AuthorizationRequest = {
  address?: Address;
  contractAddress?: Address;
  chainId: number;
  nonce: number;
};

type SignedAuthorization = {
  address: Address;
  chainId: number;
  nonce: number;
  r: Hex;
  s: Hex;
  v?: bigint;
  yParity: number;
};

// SmartAccountSigner interface compatible with @account-kit/smart-contracts
interface SmartAccountSigner<Inner = any> {
  signerType: string;
  inner: Inner;
  getAddress: () => Promise<Address>;
  signMessage: (message: SignableMessage) => Promise<Hex>;
  signTypedData: (params: TypedDataDefinition) => Promise<Hex>;
  signAuthorization?: (unsignedAuthorization: AuthorizationRequest) => Promise<SignedAuthorization>;
}

export class LitActionsSmartSigner implements SmartAccountSigner {
  readonly signerType = 'lit-actions';
  readonly inner: any;
  private pkpPublicKey: string;
  private signerAddress: string;

  constructor(config: LitActionsSmartSignerConfig) {
    if (config.pkpPublicKey.startsWith('0x')) {
      config.pkpPublicKey = config.pkpPublicKey.slice(2);
    }
    this.pkpPublicKey = config.pkpPublicKey;
    this.signerAddress = ethers.utils.computeAddress('0x' + config.pkpPublicKey);
    this.inner = {
      pkpPublicKey: config.pkpPublicKey,
      chainId: config.chainId,
    }; // Inner client reference
  }

  async getAddress(): Promise<Address> {
    return this.signerAddress as Address;
  }

  async signMessage(message: SignableMessage): Promise<Hex> {
    let messageToSign: string | Uint8Array;

    if (typeof message === 'string') {
      messageToSign = message;
    } else {
      messageToSign =
        typeof message.raw === 'string' ? ethers.utils.arrayify(message.raw) : message.raw;
    }

    const messageHash = ethers.utils.hashMessage(messageToSign);

    const sig = await Lit.Actions.signAndCombineEcdsa({
      toSign: ethers.utils.arrayify(messageHash),
      publicKey: this.pkpPublicKey,
      sigName: `alchemyMessage`,
    });

    const parsedSig = JSON.parse(sig);

    return ethers.utils.joinSignature({
      r: '0x' + parsedSig.r.substring(2),
      s: '0x' + parsedSig.s,
      v: parsedSig.v,
    }) as Hex;
  }

  async signTypedData(params: TypedDataDefinition): Promise<Hex> {
    // console.log("signTypedData called with params", params);
    // Create the EIP-712 hash
    const hash = ethers.utils._TypedDataEncoder.hash(
      params.domain || {},
      params.types || {},
      params.message || {},
    );

    const sig = await Lit.Actions.signAndCombineEcdsa({
      toSign: ethers.utils.arrayify(hash),
      publicKey: this.pkpPublicKey,
      sigName: `alchemyTypedData`,
    });

    const parsedSig = JSON.parse(sig);

    return ethers.utils.joinSignature({
      r: '0x' + parsedSig.r.substring(2),
      s: '0x' + parsedSig.s,
      v: parsedSig.v,
    }) as Hex;
  }

  // reference implementation is from Viem SmartAccountSigner
  async signAuthorization(
    unsignedAuthorization: AuthorizationRequest,
  ): Promise<SignedAuthorization> {
    // console.log("signAuthorization called with params", unsignedAuthorization);
    const { contractAddress, chainId, nonce } = unsignedAuthorization;

    if (!contractAddress || !chainId) {
      throw new Error('Invalid authorization: contractAddress and chainId are required');
    }

    const hash = ethers.utils.keccak256(
      ethers.utils.hexConcat([
        '0x05',
        ethers.utils.RLP.encode([
          ethers.utils.hexlify(chainId),
          contractAddress,
          nonce ? ethers.utils.hexlify(nonce) : '0x',
        ]),
      ]),
    );

    const sig = await Lit.Actions.signAndCombineEcdsa({
      toSign: ethers.utils.arrayify(hash),
      publicKey: this.pkpPublicKey,
      sigName: `alchemyAuth7702`,
    });
    const sigObj = JSON.parse(sig);

    return {
      address: (unsignedAuthorization.address || contractAddress!) as Address,
      chainId: chainId,
      nonce: nonce,
      r: ('0x' + sigObj.r.substring(2)) as Hex,
      s: ('0x' + sigObj.s) as Hex,
      v: BigInt(sigObj.v),
      yParity: sigObj.v,
    };
  }
}
