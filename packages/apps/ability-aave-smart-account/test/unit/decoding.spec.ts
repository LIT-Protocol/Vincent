import { describe, it, expect } from '@jest/globals';
import { encodeFunctionData, getAddress, type Address, type Hex } from 'viem';
import { decodeUserOp, decodeTransaction } from '../../src/lib/helpers/decoding';
import { AAVE_POOL_ABI, FEE_CONTRACT_ABI } from '../../src/lib/helpers/aave';
import { ERC20_ABI } from '../../src/lib/helpers/erc20';
import type { UserOp } from '../../src/lib/helpers/userOperation';
import type { Transaction } from '../../src/lib/helpers/transaction';

describe('decoding helpers', () => {
  const aavePoolAddress = getAddress('0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'); // Ethereum mainnet
  const feeContractAddress = getAddress('0x1234567890123456789012345678901234567890');
  const senderAddress = getAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'); // Vitalik's address

  describe('decodeTransaction', () => {
    it('should decode valid Aave borrow transaction', () => {
      const borrowCalldata = encodeFunctionData({
        abi: AAVE_POOL_ABI,
        functionName: 'borrow',
        args: [
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // asset
          1000000n, // amount
          2n, // interestRateMode
          0, // referralCode
          senderAddress, // onBehalfOf
        ],
      });

      const transaction: Transaction = {
        from: senderAddress,
        to: aavePoolAddress,
        data: borrowCalldata,
        value: '0x0',
        nonce: '0x0',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        chainId: 1,
      };

      const result = decodeTransaction({
        aavePoolAddress,
        feeContractAddress,
        transaction,
      });

      expect(result.ok).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('should decode valid Aave repay transaction', () => {
      const repayCalldata = encodeFunctionData({
        abi: AAVE_POOL_ABI,
        functionName: 'repay',
        args: [
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // asset
          1000000n, // amount
          2n, // interestRateMode
          senderAddress, // onBehalfOf
        ],
      });

      const transaction: Transaction = {
        from: senderAddress,
        to: aavePoolAddress,
        data: repayCalldata,
        value: '0x0',
        nonce: '0x0',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        chainId: 1,
      };

      const result = decodeTransaction({
        aavePoolAddress,
        feeContractAddress,
        transaction,
      });

      expect(result.ok).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('should reject Aave supply transaction (must use fee contract)', () => {
      const supplyCalldata = encodeFunctionData({
        abi: AAVE_POOL_ABI,
        functionName: 'supply',
        args: [
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // asset
          1000000n, // amount
          senderAddress, // onBehalfOf
          0, // referralCode
        ],
      });

      const transaction: Transaction = {
        from: senderAddress,
        to: aavePoolAddress,
        data: supplyCalldata,
        value: '0x0',
        nonce: '0x0',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        chainId: 1,
      };

      const result = decodeTransaction({
        aavePoolAddress,
        feeContractAddress,
        transaction,
      });

      expect(result.ok).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons[0]).toContain('supply must go through fee contract');
    });

    it('should reject Aave withdraw transaction (must use fee contract)', () => {
      const withdrawCalldata = encodeFunctionData({
        abi: AAVE_POOL_ABI,
        functionName: 'withdraw',
        args: [
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // asset
          1000000n, // amount
          senderAddress, // to
        ],
      });

      const transaction: Transaction = {
        from: senderAddress,
        to: aavePoolAddress,
        data: withdrawCalldata,
        value: '0x0',
        nonce: '0x0',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        chainId: 1,
      };

      const result = decodeTransaction({
        aavePoolAddress,
        feeContractAddress,
        transaction,
      });

      expect(result.ok).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons[0]).toContain('withdraw must go through fee contract');
    });

    it('should decode valid ERC20 approval transaction', () => {
      const approveCalldata = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [aavePoolAddress, 1000000n],
      });

      const transaction: Transaction = {
        from: senderAddress,
        to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        data: approveCalldata,
        value: '0x0',
        nonce: '0x0',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        chainId: 1,
      };

      const result = decodeTransaction({
        aavePoolAddress,
        feeContractAddress,
        transaction,
      });

      expect(result.ok).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('should reject ERC20 approval to non-allowed spender', () => {
      const nonAllowedSpender = getAddress('0x1111111111111111111111111111111111111111');
      const approveCalldata = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [nonAllowedSpender, 1000000n],
      });

      const transaction: Transaction = {
        from: senderAddress,
        to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        data: approveCalldata,
        value: '0x0',
        nonce: '0x0',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        chainId: 1,
      };

      const result = decodeTransaction({
        aavePoolAddress,
        feeContractAddress: null, // Don't use fee contract for this test
        transaction,
      });

      expect(result.ok).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons[0]).toContain('non-allowed spender');
    });

    it('should reject infinite ERC20 approval', () => {
      const maxUint256 = 2n ** 256n - 1n;
      const approveCalldata = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [aavePoolAddress, maxUint256],
      });

      const transaction: Transaction = {
        from: senderAddress,
        to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        data: approveCalldata,
        value: '0x0',
        nonce: '0x0',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        chainId: 1,
      };

      const result = decodeTransaction({
        aavePoolAddress,
        feeContractAddress,
        transaction,
      });

      expect(result.ok).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons[0]).toContain('Infinite approval not allowed');
    });

    it('should reject transaction to non-allowed target', () => {
      const nonAllowedTarget = getAddress('0x2222222222222222222222222222222222222222');
      const transaction: Transaction = {
        from: senderAddress,
        to: nonAllowedTarget,
        data: '0x1234',
        value: '0x0',
        nonce: '0x0',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        chainId: 1,
      };

      const result = decodeTransaction({
        aavePoolAddress,
        feeContractAddress: null, // Don't use fee contract for this test
        transaction,
      });

      expect(result.ok).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons[0]).toContain('Target not in allowlist');
    });

    it('should reject borrow with wrong onBehalfOf', () => {
      const wrongOnBehalfOf = getAddress('0x1234567890123456789012345678901234567890');
      const borrowCalldata = encodeFunctionData({
        abi: AAVE_POOL_ABI,
        functionName: 'borrow',
        args: [
          '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // asset
          1000000n, // amount
          2n, // interestRateMode
          0, // referralCode
          wrongOnBehalfOf, // onBehalfOf (wrong)
        ],
      });

      const transaction: Transaction = {
        from: senderAddress,
        to: aavePoolAddress,
        data: borrowCalldata,
        value: '0x0',
        nonce: '0x0',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        chainId: 1,
      };

      const result = decodeTransaction({
        aavePoolAddress,
        feeContractAddress,
        transaction,
      });

      expect(result.ok).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons[0]).toContain('borrow.onBehalfOf != sender');
    });
  });

  describe('decodeUserOp', () => {
    // Note: decodeUserOp requires decoding smart account calldata (Kernel/Safe)
    // This is more complex and would require mocking the smart account decoding
    // For now, we'll test the basic structure

    it('should handle userOp with invalid callData', async () => {
      const userOp: UserOp = {
        sender: senderAddress,
        nonce: '0x0',
        callData: '0xinvalid', // Invalid callData that can't be decoded
        callGasLimit: '0x5208',
        verificationGasLimit: '0x5208',
        preVerificationGas: '0x5208',
        maxFeePerGas: '0x3b9aca00',
        maxPriorityFeePerGas: '0x3b9aca00',
      };

      const result = await decodeUserOp({
        aavePoolAddress,
        feeContractAddress,
        userOp,
      });

      // Should fail because callData can't be decoded
      expect(result.ok).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
    });
  });
});
