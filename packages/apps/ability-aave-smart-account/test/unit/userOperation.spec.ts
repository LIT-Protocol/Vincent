import { describe, it, expect } from '@jest/globals';
import { getAddress, type Hex } from 'viem';
import { userOpSchema, toVincentUserOp, type UserOp } from '../../src/lib/helpers/userOperation';

// Use a known valid checksummed address for testing
const TEST_ADDRESS = getAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'); // Vitalik's address

describe('userOperation helpers', () => {
  describe('userOpSchema', () => {
    it('should accept valid userOp', () => {
      const validUserOp: UserOp = {
        sender: TEST_ADDRESS,
        nonce: '0x0',
        callData: '0x',
        callGasLimit: '0x5208',
        verificationGasLimit: '0x5208',
        preVerificationGas: '0x5208',
        maxFeePerGas: '0x3b9aca00',
        maxPriorityFeePerGas: '0x3b9aca00',
        paymasterVerificationGasLimit: '0x0',
        paymasterPostOpGasLimit: '0x0',
      };
      expect(() => userOpSchema.parse(validUserOp)).not.toThrow();
    });

    it('should accept userOp with optional fields', () => {
      const validUserOp: UserOp = {
        sender: TEST_ADDRESS,
        nonce: '0x0',
        callData: '0x',
        callGasLimit: '0x5208',
        verificationGasLimit: '0x5208',
        preVerificationGas: '0x5208',
        maxFeePerGas: '0x3b9aca00',
        maxPriorityFeePerGas: '0x3b9aca00',
        paymasterVerificationGasLimit: '0x0',
        paymasterPostOpGasLimit: '0x0',
        signature: '0x1234',
        paymaster: TEST_ADDRESS,
        paymasterData: '0x',
        factory: TEST_ADDRESS,
        factoryData: '0x',
      };
      expect(() => userOpSchema.parse(validUserOp)).not.toThrow();
    });

    it('should reject invalid nonce format', () => {
      const invalidUserOp = {
        sender: TEST_ADDRESS,
        nonce: 'invalid',
        callData: '0x',
        callGasLimit: '0x5208',
        verificationGasLimit: '0x5208',
        preVerificationGas: '0x5208',
        maxFeePerGas: '0x3b9aca00',
        maxPriorityFeePerGas: '0x3b9aca00',
      };
      expect(() => userOpSchema.parse(invalidUserOp)).toThrow();
    });

    it('should reject invalid gas limit format', () => {
      const invalidUserOp = {
        sender: TEST_ADDRESS,
        nonce: '0x0',
        callData: '0x',
        callGasLimit: 'invalid',
        verificationGasLimit: '0x5208',
        preVerificationGas: '0x5208',
        maxFeePerGas: '0x3b9aca00',
        maxPriorityFeePerGas: '0x3b9aca00',
      };
      expect(() => userOpSchema.parse(invalidUserOp)).toThrow();
    });
  });

  describe('toVincentUserOp', () => {
    it('should convert numeric values to hex', () => {
      const genericUserOp = {
        callData: '0x' as Hex,
        callGasLimit: 21000,
        maxFeePerGas: 1000000000,
        maxPriorityFeePerGas: 1000000000,
        nonce: '0x0', // nonce should already be hex
        preVerificationGas: 21000,
        verificationGasLimit: 21000,
        signature: '0x' as Hex,
      };
      const result = toVincentUserOp(genericUserOp);
      expect(result.callGasLimit).toBe('0x5208');
      expect(result.maxFeePerGas).toBe('0x3b9aca00');
      expect(result.maxPriorityFeePerGas).toBe('0x3b9aca00');
      expect(result.nonce).toBe('0x0');
      expect(result.preVerificationGas).toBe('0x5208');
      expect(result.verificationGasLimit).toBe('0x5208');
    });

    it('should preserve hex values', () => {
      const genericUserOp = {
        callData: '0x' as Hex,
        callGasLimit: '0x5208',
        maxFeePerGas: '0x3b9aca00',
        maxPriorityFeePerGas: '0x3b9aca00',
        nonce: '0x0',
        preVerificationGas: '0x5208',
        verificationGasLimit: '0x5208',
        signature: '0x' as Hex,
      };
      const result = toVincentUserOp(genericUserOp);
      expect(result.callGasLimit).toBe('0x5208');
      expect(result.maxFeePerGas).toBe('0x3b9aca00');
      expect(result.maxPriorityFeePerGas).toBe('0x3b9aca00');
      expect(result.nonce).toBe('0x0');
    });

    it('should handle optional fields', () => {
      const genericUserOp = {
        callData: '0x' as Hex,
        callGasLimit: '0x5208',
        maxFeePerGas: '0x3b9aca00',
        maxPriorityFeePerGas: '0x3b9aca00',
        nonce: '0x0',
        preVerificationGas: '0x5208',
        verificationGasLimit: '0x5208',
        signature: '0x' as Hex,
        paymaster: TEST_ADDRESS,
        paymasterData: '0x' as Hex,
        paymasterPostOpGasLimit: 10000,
        paymasterVerificationGasLimit: 10000,
      };
      const result = toVincentUserOp(genericUserOp);
      expect(result.paymaster).toBe(TEST_ADDRESS);
      expect(result.paymasterPostOpGasLimit).toBe('0x2710');
      expect(result.paymasterVerificationGasLimit).toBe('0x2710');
    });
  });
});
