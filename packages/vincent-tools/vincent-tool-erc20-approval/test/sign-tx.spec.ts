import { signTx } from '../src/lib/tool-helpers/sign-tx';

// Mock Lit global
interface LitActions {
  signAndCombineEcdsa: (params: {
    toSign: Uint8Array;
    publicKey: string;
    sigName: string;
  }) => Promise<string>;
}

interface LitGlobal {
  Actions: LitActions;
}

declare global {
  interface Window {
    Lit: LitGlobal;
  }
}

describe('signTx', () => {
  const mockPkpPubKey = '0x1234567890abcdef';
  const mockSigName = 'testSig';
  const mockTx = {
    to: '0x756fA449De893446B26e10C6C66E62ccabeE908C',
    data: '0x1234567890abcdef',
    value: 0n,
    gas: 21000n,
    maxFeePerGas: 1000000000n,
    maxPriorityFeePerGas: 1000000000n,
    nonce: 0,
    chainId: 175188,
    type: 'eip1559',
  } as const;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly parse signature and return serialized transaction', async () => {
    // Mock signature response
    const mockSignature = {
      r: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      s: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      v: '27', // This will result in yParity = 1
    };

    // Mock Lit.Actions.signAndCombineEcdsa
    (global as any).Lit = {
      Actions: {
        signAndCombineEcdsa: jest.fn().mockResolvedValue(JSON.stringify(mockSignature)),
      },
    };

    // Execute
    const result = await signTx({
      pkpPublicKey: mockPkpPubKey,
      tx: mockTx,
      sigName: mockSigName,
    });

    // Assert
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.startsWith('0x')).toBe(true);

    // Verify Lit.Actions.signAndCombineEcdsa was called with correct parameters
    expect((global as any).Lit.Actions.signAndCombineEcdsa).toHaveBeenCalledWith({
      toSign: expect.any(Uint8Array),
      publicKey: mockPkpPubKey.replace(/^0x/, ''),
      sigName: mockSigName,
    });
  });

  it('should handle even v value for yParity calculation', async () => {
    // Mock signature response with even v value
    const mockSignature = {
      r: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      s: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      v: '28', // This will result in yParity = 0
    };

    // Mock Lit.Actions.signAndCombineEcdsa
    (global as any).Lit = {
      Actions: {
        signAndCombineEcdsa: jest.fn().mockResolvedValue(JSON.stringify(mockSignature)),
      },
    };

    // Execute
    const result = await signTx({
      pkpPublicKey: mockPkpPubKey,
      tx: mockTx,
      sigName: mockSigName,
    });

    // Assert
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.startsWith('0x')).toBe(true);
  });

  it('should throw error when signature parsing fails', async () => {
    // Mock invalid signature response
    const invalidSignature = 'invalid json';

    // Mock Lit.Actions.signAndCombineEcdsa
    (global as any).Lit = {
      Actions: {
        signAndCombineEcdsa: jest.fn().mockResolvedValue(invalidSignature),
      },
    };

    // Execute and Assert
    await expect(
      signTx({
        pkpPublicKey: mockPkpPubKey,
        tx: mockTx,
        sigName: mockSigName,
      }),
    ).rejects.toThrow();
  });
});
