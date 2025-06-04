import { sendErc20ApprovalTx } from '../src/lib/tool-helpers/send-erc20-approval-tx';
import { getEnv } from './test-config';

// Mock Lit.Actions
const mockRunOnce = jest.fn();
const mockSignAndCombineEcdsa = jest.fn();
global.Lit = {
  Actions: {
    runOnce: mockRunOnce,
    signAndCombineEcdsa: mockSignAndCombineEcdsa,
  },
} as any;

describe('sendErc20ApprovalTx', () => {
  const rpcUrl = getEnv('RPC_URL_FOR_UNISWAP');
  const chainId = 1; // Ethereum mainnet

  // WETH token
  const tokenInAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`;
  const tokenInDecimals = 18;
  const tokenInAmount = BigInt('100000000000000000'); // 0.1 WETH in wei
  const pkpEthAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`;
  const pkpPublicKey = '0x1234';

  beforeEach(() => {
    mockRunOnce.mockClear();
    mockSignAndCombineEcdsa.mockClear();
    // Mock successful signature
    mockSignAndCombineEcdsa.mockResolvedValueOnce(
      JSON.stringify({
        signature: '0x123456789',
        publicKey: pkpPublicKey,
      }),
    );
  });

  it('should send ERC20 approval transaction', async () => {
    // Mock successful transaction
    mockRunOnce.mockResolvedValueOnce(
      JSON.stringify({
        status: 'success',
        txHash: '0x123456789',
      }),
    );

    // Execute
    const result = await sendErc20ApprovalTx({
      rpcUrl,
      chainId,
      tokenInAmount,
      tokenInDecimals,
      tokenInAddress,
      pkpEthAddress,
      pkpPublicKey,
    });

    // Verify Lit.Actions.runOnce was called correctly
    expect(mockRunOnce).toHaveBeenCalledTimes(1);
    expect(mockRunOnce).toHaveBeenCalledWith(
      { waitForResponse: true, name: 'spendTxSender' },
      expect.any(Function),
    );

    // Verify Lit.Actions.signAndCombineEcdsa was called
    expect(mockSignAndCombineEcdsa).toHaveBeenCalledTimes(1);
    expect(mockSignAndCombineEcdsa).toHaveBeenCalledWith(
      expect.objectContaining({
        publicKey: pkpPublicKey.replace(/^0x/, ''),
        sigName: 'approveErc20Sig',
      }),
    );

    // Verify result
    expect(result).toBe('0x123456789');
  });

  it('should throw error when transaction fails', async () => {
    // Mock failed transaction
    mockRunOnce.mockResolvedValueOnce(
      JSON.stringify({
        status: 'error',
        error: 'Transaction failed',
      }),
    );

    // Execute and verify error
    await expect(
      sendErc20ApprovalTx({
        rpcUrl,
        chainId,
        tokenInAmount,
        tokenInDecimals,
        tokenInAddress,
        pkpEthAddress,
        pkpPublicKey,
      }),
    ).rejects.toThrow('Error sending spend transaction: Transaction failed');
  });

  it('should throw error for unsupported chainId', async () => {
    // Execute with unsupported chainId
    await expect(
      sendErc20ApprovalTx({
        rpcUrl,
        chainId: 999, // Unsupported chainId
        tokenInAmount,
        tokenInDecimals,
        tokenInAddress,
        pkpEthAddress,
        pkpPublicKey,
      }),
    ).rejects.toThrow('Unsupported chainId: 999');
  });
});
