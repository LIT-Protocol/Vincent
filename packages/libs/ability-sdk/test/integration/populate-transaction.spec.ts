import { VoidSigner, formatUnits, Interface } from 'ethers-v6';

import { populateTransaction } from '../../src/lib/abilityHelpers/populateTransaction';
import { BASE_RPC_URL } from '../helpers/test-variables';

// Extend Jest timeout to 30 seconds for live RPC
jest.setTimeout(30000);

describe('populateTransaction (live and mocked)', () => {
  // ERC20 ABI for balanceOf function
  const erc20Abi = ['function balanceOf(address owner) view returns (uint256)'];
  const erc20Interface = new Interface(erc20Abi);

  const mockTransaction = {
    to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    from: '0x1234567890123456789012345678901234567890',
    data: erc20Interface.encodeFunctionData('balanceOf', [
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    ]),
    value: '0x0',
  };

  describe('live: Base network', () => {
    it('should populate transaction with real gas estimates from Base network and apply buffers', async () => {
      const result = await populateTransaction({
        to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
        from: '0x1234567890123456789012345678901234567890',
        data: erc20Interface.encodeFunctionData('balanceOf', [
          '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        ]),
        value: '0x0',
        rpcUrl: BASE_RPC_URL,
        gasBufferPercentage: 50,
        baseFeePerGasBufferPercentage: 20,
      });

      // Basic structure checks
      expect(result).toBeDefined();
      expect(result.to).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
      expect(result.data).toBe(
        erc20Interface.encodeFunctionData('balanceOf', [
          '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        ]),
      );
      expect(result.value).toBe('0x0');
      expect(result.gasLimit).toBeDefined();

      if (result.gasPrice) throw new Error('Base network should be using EIP-1559');
      // EIP-1559 transaction path (expected on Base)
      expect(result.maxFeePerGas).toBeDefined();
      expect(result.maxPriorityFeePerGas).toBeDefined();

      console.log('[live: Base network] Populated Transaction (EIP-1559):', {
        gasLimit: result.gasLimit,
        // @ts-expect-error - maxFeePerGas is defined
        maxFeePerGasGwei: formatUnits(result.maxFeePerGas, 'gwei') + ' gwei',
        // @ts-expect-error - maxPriorityFeePerGas is defined
        maxPriorityFeePerGasGwei: formatUnits(result.maxPriorityFeePerGas, 'gwei') + ' gwei',
      });
    });
  });

  describe('mocked: deterministic behavior', () => {
    let populateTransactionSpy: jest.SpyInstance;

    beforeEach(() => {
      populateTransactionSpy = jest.spyOn(VoidSigner.prototype, 'populateTransaction');
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });

    it('should apply gas buffer when gasBufferPercentage is provided', async () => {
      const baseGasLimit = 100000n;
      const gasBufferPercentage = 50;

      populateTransactionSpy.mockResolvedValue({
        to: mockTransaction.to,
        data: mockTransaction.data,
        value: mockTransaction.value,
        gasLimit: baseGasLimit,
        gasPrice: 20_000_000_000n, // 20 gwei (legacy tx)
        chainId: 1,
      });

      const result = await populateTransaction({
        ...mockTransaction,
        rpcUrl: 'http://mock.rpc',
        gasBufferPercentage,
      });

      // Gas buffer: 100000 * 1.5 = 150000
      const expectedGasLimit = (baseGasLimit * 150n) / 100n;
      expect(result.gasLimit).toBe('0x' + expectedGasLimit.toString(16));
      expect(result.gasPrice).toBe('0x' + 20_000_000_000n.toString(16));
    });

    it('should apply baseFeePerGas buffer for EIP-1559 transactions', async () => {
      const baseGasLimit = 80000n;
      const baseMaxFeePerGas = 2_000_000_000n; // 2 gwei
      const baseFeePerGasBufferPercentage = 25;

      populateTransactionSpy.mockResolvedValue({
        to: mockTransaction.to,
        data: mockTransaction.data,
        value: mockTransaction.value,
        gasLimit: baseGasLimit,
        maxFeePerGas: baseMaxFeePerGas,
        maxPriorityFeePerGas: 1_000_000_000n, // 1 gwei
        chainId: 1,
      });

      const result = await populateTransaction({
        ...mockTransaction,
        rpcUrl: 'http://mock.rpc',
        baseFeePerGasBufferPercentage,
      });

      // Base fee buffer: 2 gwei * 1.25 = 2.5 gwei
      const expectedMaxFeePerGas = (baseMaxFeePerGas * 125n) / 100n;
      expect(result.maxFeePerGas).toBe('0x' + expectedMaxFeePerGas.toString(16));
      expect(result.maxPriorityFeePerGas).toBe('0x' + 1_000_000_000n.toString(16));
    });

    it('should apply both gas and base fee buffers', async () => {
      const baseGasLimit = 60000n;
      const baseMaxFeePerGas = 3_000_000_000n; // 3 gwei
      const gasBufferPercentage = 30;
      const baseFeePerGasBufferPercentage = 15;

      populateTransactionSpy.mockResolvedValue({
        to: mockTransaction.to,
        data: mockTransaction.data,
        value: mockTransaction.value,
        gasLimit: baseGasLimit,
        maxFeePerGas: baseMaxFeePerGas,
        maxPriorityFeePerGas: 500_000_000n, // 0.5 gwei
        chainId: 1,
      });

      const result = await populateTransaction({
        ...mockTransaction,
        rpcUrl: 'http://mock.rpc',
        gasBufferPercentage,
        baseFeePerGasBufferPercentage,
      });

      // Gas buffer: 60000 * 1.3 = 78000
      const expectedGasLimit = (baseGasLimit * 130n) / 100n;
      expect(result.gasLimit).toBe('0x' + expectedGasLimit.toString(16));

      // Base fee buffer: 3 gwei * 1.15 = 3.45 gwei
      const expectedMaxFeePerGas = (baseMaxFeePerGas * 115n) / 100n;
      expect(result.maxFeePerGas).toBe('0x' + expectedMaxFeePerGas.toString(16));
    });

    it('should not modify gas parameters when no buffers are provided', async () => {
      const baseGasLimit = 42000n;
      const baseGasPrice = 15_000_000_000n; // 15 gwei

      populateTransactionSpy.mockResolvedValue({
        to: mockTransaction.to,
        data: mockTransaction.data,
        value: mockTransaction.value,
        gasLimit: baseGasLimit,
        gasPrice: baseGasPrice,
        chainId: 1,
      });

      const result = await populateTransaction({
        ...mockTransaction,
        rpcUrl: 'http://mock.rpc',
      });

      // No buffers applied
      expect(result.gasLimit).toBe('0x' + baseGasLimit.toString(16));
      expect(result.gasPrice).toBe('0x' + baseGasPrice.toString(16));
    });

    it('should return legacy transaction unchanged when gasPrice is present', async () => {
      const mockLegacyTx = {
        to: mockTransaction.to,
        data: mockTransaction.data,
        value: mockTransaction.value,
        gasLimit: 50000n,
        gasPrice: 10_000_000_000n, // 10 gwei
        chainId: 1,
      };

      populateTransactionSpy.mockResolvedValue(mockLegacyTx);

      const result = await populateTransaction({
        ...mockTransaction,
        rpcUrl: 'http://mock.rpc',
        baseFeePerGasBufferPercentage: 50, // Should be ignored for legacy tx
      });

      expect(result.gasPrice).toBe('0x' + 10_000_000_000n.toString(16));
      expect(result.maxFeePerGas).toBeUndefined();
      expect(result.maxPriorityFeePerGas).toBeUndefined();
    });

    it('should throw error when gasLimit is missing', async () => {
      populateTransactionSpy.mockResolvedValue({
        to: mockTransaction.to,
        data: mockTransaction.data,
        value: mockTransaction.value,
        // gasLimit is missing
        gasPrice: 20_000_000_000n,
        chainId: 1,
      });

      await expect(
        populateTransaction({
          ...mockTransaction,
          rpcUrl: 'http://mock.rpc',
        }),
      ).rejects.toThrow('[estimateGas] Unable to estimate gas for transaction');
    });

    it('should throw error when EIP-1559 transaction is missing maxFeePerGas', async () => {
      populateTransactionSpy.mockResolvedValue({
        to: mockTransaction.to,
        data: mockTransaction.data,
        value: mockTransaction.value,
        gasLimit: 50000n,
        maxPriorityFeePerGas: 1_000_000_000n,
        chainId: 1,
      });

      await expect(
        populateTransaction({
          ...mockTransaction,
          rpcUrl: 'http://mock.rpc',
        }),
      ).rejects.toThrow('[estimateGas] maxFeePerGas is missing from populated transaction');
    });
  });

  describe('edge cases', () => {
    let populateTransactionSpy: jest.SpyInstance;

    beforeEach(() => {
      populateTransactionSpy = jest.spyOn(VoidSigner.prototype, 'populateTransaction');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('throws error when gasBufferPercentage is not an integer', async () => {
      await expect(
        populateTransaction({
          ...mockTransaction,
          rpcUrl: 'http://mock.rpc',
          gasBufferPercentage: 37.5,
        }),
      ).rejects.toThrow('[populateTransaction] gasBufferPercentage must be an integer');
    });

    it('throws error when baseFeePerGasBufferPercentage is not an integer', async () => {
      await expect(
        populateTransaction({
          ...mockTransaction,
          rpcUrl: 'http://mock.rpc',
          baseFeePerGasBufferPercentage: 12.5,
        }),
      ).rejects.toThrow('[populateTransaction] baseFeePerGasBufferPercentage must be an integer');
    });

    it('handles zero buffer percentages', async () => {
      const baseGasLimit = 25000n;
      const baseMaxFeePerGas = 1_000_000_000n;

      populateTransactionSpy.mockResolvedValue({
        to: mockTransaction.to,
        data: mockTransaction.data,
        value: mockTransaction.value,
        gasLimit: baseGasLimit,
        maxFeePerGas: baseMaxFeePerGas,
        maxPriorityFeePerGas: 500_000_000n,
        chainId: 1,
      });

      const result = await populateTransaction({
        ...mockTransaction,
        rpcUrl: 'http://mock.rpc',
        gasBufferPercentage: 0,
        baseFeePerGasBufferPercentage: 0,
      });

      // No changes with 0% buffers
      expect(result.gasLimit).toBe('0x' + baseGasLimit.toString(16));
      expect(result.maxFeePerGas).toBe('0x' + baseMaxFeePerGas.toString(16));
    });

    it('passes through chainId when provided', async () => {
      const chainId = 8453; // Base mainnet

      populateTransactionSpy.mockResolvedValue({
        to: mockTransaction.to,
        data: mockTransaction.data,
        value: mockTransaction.value,
        gasLimit: 21000n,
        gasPrice: 5_000_000_000n,
        chainId,
      });

      const result = await populateTransaction({
        ...mockTransaction,
        rpcUrl: 'http://mock.rpc',
        chainId,
      });

      expect(result.chainId).toBe(chainId);
      expect(populateTransactionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId,
        }),
      );
    });
  });
});
