import { sendSpendTx } from '../src/lib/policy-helpers/send-spend-tx';
import { createChronicleYellowstoneViemClient } from '../src/lib/policy-helpers/viem-chronicle-yellowstone-client';
import { signTx } from '../src/lib/policy-helpers/sign-tx';

// Mock Lit global
interface LitActions {
  runOnce: (
    params: {
      waitForResponse: boolean;
      name: string;
    },
    callback: () => Promise<string>,
  ) => Promise<string>;
}

interface LitGlobal {
  Actions: LitActions;
}

declare global {
  interface Window {
    Lit: LitGlobal;
  }
}

// Mock the modules
jest.mock('../src/lib/policy-helpers/viem-chronicle-yellowstone-client', () => ({
  createChronicleYellowstoneViemClient: jest.fn(),
}));

jest.mock('../src/lib/policy-helpers/sign-tx', () => ({
  signTx: jest.fn(),
}));

describe('sendSpendTx', () => {
  const mockPkpEthAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const mockPkpPubKey = '0x1234567890abcdef';
  const mockAppId = 1;
  const mockAmountSpentUsd = 100;
  const mockMaxSpendingLimitInUsd = 1000;
  const mockSpendingLimitDuration = 86400;

  const mockEstimatedGas = 21000n;
  const mockMaxFeePerGas = 1000000000n;
  const mockMaxPriorityFeePerGas = 1000000000n;
  const mockNonce = 0;
  const mockTxData = '0x1234567890abcdef';
  const mockSignedTx = '0xabcdef1234567890';
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Lit.Actions.runOnce for gas estimation
    (global as any).Lit = {
      Actions: {
        runOnce: jest.fn().mockImplementation(async (params, callback) => {
          if (params.name === 'send spend tx gas estimation') {
            return JSON.stringify({
              status: 'success',
              data: mockTxData,
              gasLimit: mockEstimatedGas.toString(),
              maxFeePerGas: mockMaxFeePerGas.toString(),
              maxPriorityFeePerGas: mockMaxPriorityFeePerGas.toString(),
              nonce: mockNonce.toString(),
            });
          } else if (params.name === 'spendTxSender') {
            // Execute the callback which will call sendRawTransaction
            return callback();
          }
          return '';
        }),
      },
    };

    // Mock viem client
    mockClient = {
      estimateFeesPerGas: jest.fn().mockResolvedValue({
        maxFeePerGas: mockMaxFeePerGas,
        maxPriorityFeePerGas: mockMaxPriorityFeePerGas,
      }),
      getTransactionCount: jest.fn().mockResolvedValue(mockNonce),
      sendRawTransaction: jest.fn().mockResolvedValue('0x1234567890abcdef'),
    };

    (createChronicleYellowstoneViemClient as any).mockReturnValue(mockClient);

    // Mock signTx
    (signTx as any).mockResolvedValue(mockSignedTx);
  });

  it('should send spend transaction with correct parameters', async () => {
    // Execute
    const result = await sendSpendTx({
      appId: mockAppId,
      amountSpentUsd: mockAmountSpentUsd,
      maxSpendingLimitInUsd: mockMaxSpendingLimitInUsd,
      spendingLimitDuration: mockSpendingLimitDuration,
      pkpEthAddress: mockPkpEthAddress,
      pkpPubKey: mockPkpPubKey,
    });

    // Assert
    expect(result).toBe('0x1234567890abcdef');

    // Verify Lit.Actions.runOnce was called with correct parameters
    expect((global as any).Lit.Actions.runOnce).toHaveBeenCalledTimes(2);
    expect((global as any).Lit.Actions.runOnce).toHaveBeenNthCalledWith(
      1,
      { waitForResponse: true, name: 'send spend tx gas estimation' },
      expect.any(Function),
    );
    expect((global as any).Lit.Actions.runOnce).toHaveBeenNthCalledWith(
      2,
      { waitForResponse: true, name: 'spendTxSender' },
      expect.any(Function),
    );

    // Verify signTx was called with correct parameters
    expect(signTx).toHaveBeenCalledWith({
      pkpPublicKey: mockPkpPubKey,
      tx: {
        to: '0x756fA449De893446B26e10C6C66E62ccabeE908C',
        data: mockTxData,
        value: 0n,
        gas: mockEstimatedGas,
        maxFeePerGas: mockMaxFeePerGas,
        maxPriorityFeePerGas: mockMaxPriorityFeePerGas,
        nonce: mockNonce,
        chainId: 175188,
        type: 'eip1559',
      },
      sigName: 'spendingLimitSig',
    });

    // Verify sendRawTransaction was called with signed transaction
    expect(mockClient.sendRawTransaction).toHaveBeenCalledWith({
      serializedTransaction: mockSignedTx,
    });
  });

  it('should throw error when gas estimation fails', async () => {
    // Mock gas estimation failure
    (global as any).Lit.Actions.runOnce = jest.fn().mockImplementation(async (params, callback) => {
      if (params.name === 'send spend tx gas estimation') {
        return JSON.stringify({
          status: 'error',
          error: 'Gas estimation failed',
        });
      }
      return '';
    });

    // Execute and Assert
    await expect(
      sendSpendTx({
        appId: mockAppId,
        amountSpentUsd: mockAmountSpentUsd,
        maxSpendingLimitInUsd: mockMaxSpendingLimitInUsd,
        spendingLimitDuration: mockSpendingLimitDuration,
        pkpEthAddress: mockPkpEthAddress,
        pkpPubKey: mockPkpPubKey,
      }),
    ).rejects.toThrow('Error estimating gas for spending limit transaction: Gas estimation failed');
  });

  it('should throw error when transaction sending fails', async () => {
    // Mock transaction sending failure
    (global as any).Lit.Actions.runOnce = jest.fn().mockImplementation(async (params, callback) => {
      if (params.name === 'send spend tx gas estimation') {
        return JSON.stringify({
          status: 'success',
          data: mockTxData,
          gasLimit: mockEstimatedGas.toString(),
          maxFeePerGas: mockMaxFeePerGas.toString(),
          maxPriorityFeePerGas: mockMaxPriorityFeePerGas.toString(),
          nonce: mockNonce.toString(),
        });
      } else if (params.name === 'spendTxSender') {
        return JSON.stringify({
          status: 'error',
          error: 'Transaction failed',
        });
      }
      return '';
    });

    // Execute and Assert
    await expect(
      sendSpendTx({
        appId: mockAppId,
        amountSpentUsd: mockAmountSpentUsd,
        maxSpendingLimitInUsd: mockMaxSpendingLimitInUsd,
        spendingLimitDuration: mockSpendingLimitDuration,
        pkpEthAddress: mockPkpEthAddress,
        pkpPubKey: mockPkpPubKey,
      }),
    ).rejects.toThrow('Error sending spend transaction: Transaction failed');
  });
});
