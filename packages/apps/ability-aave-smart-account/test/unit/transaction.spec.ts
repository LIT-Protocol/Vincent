import { describe, it, expect } from '@jest/globals';
import { getAddress } from 'viem';
import { toVincentTransaction, type Transaction } from '../../src/lib/helpers/transaction';
import { transactionSchema } from '../../src/lib/helpers/transaction';

// Use a known valid checksummed address for testing
const TEST_ADDRESS = getAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'); // Vitalik's address

describe('transaction helpers', () => {
  describe('transactionSchema', () => {
    it('should accept valid legacy transaction', () => {
      const validTx: Transaction = {
        from: TEST_ADDRESS,
        to: TEST_ADDRESS,
        data: '0x',
        value: '0x0',
        nonce: '0x0',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        chainId: 1,
      };
      expect(() => transactionSchema.parse(validTx)).not.toThrow();
    });

    it('should accept valid EIP-1559 transaction', () => {
      const validTx: Transaction = {
        from: TEST_ADDRESS,
        to: TEST_ADDRESS,
        data: '0x',
        value: '0x0',
        nonce: '0x0',
        gas: '0x5208',
        maxFeePerGas: '0x3b9aca00',
        maxPriorityFeePerGas: '0x3b9aca00',
        chainId: 1,
      };
      expect(() => transactionSchema.parse(validTx)).not.toThrow();
    });

    it('should accept gasLimit as alias for gas', () => {
      const validTx: Transaction = {
        from: TEST_ADDRESS,
        to: TEST_ADDRESS,
        data: '0x',
        value: '0x0',
        nonce: '0x0',
        gasLimit: '0x5208',
        gasPrice: '0x3b9aca00',
        chainId: 1,
      };
      expect(() => transactionSchema.parse(validTx)).not.toThrow();
    });

    it('should reject transaction without gas or gasLimit', () => {
      const invalidTx = {
        from: TEST_ADDRESS,
        to: TEST_ADDRESS,
        data: '0x',
        value: '0x0',
        nonce: '0x0',
        gasPrice: '0x3b9aca00',
        chainId: 1,
      };
      expect(() => transactionSchema.parse(invalidTx)).toThrow();
    });

    it('should reject EIP-1559 transaction without both maxFeePerGas and maxPriorityFeePerGas', () => {
      const invalidTx = {
        from: TEST_ADDRESS,
        to: TEST_ADDRESS,
        data: '0x',
        value: '0x0',
        nonce: '0x0',
        gas: '0x5208',
        maxFeePerGas: '0x3b9aca00',
        chainId: 1,
      };
      expect(() => transactionSchema.parse(invalidTx)).toThrow();
    });
  });

  describe('toVincentTransaction', () => {
    it('should convert numeric values to hex', () => {
      const genericTx = {
        from: TEST_ADDRESS,
        to: TEST_ADDRESS,
        data: '0x',
        value: 0,
        nonce: 0,
        gas: 21000,
        gasPrice: 1000000000,
        chainId: 1,
      };
      const result = toVincentTransaction(genericTx);
      expect(result.value).toBe('0x0');
      expect(result.nonce).toBe('0x0');
      expect(result.gas).toBe('0x5208');
      expect(result.gasPrice).toBe('0x3b9aca00');
    });

    it('should convert string numeric values to hex', () => {
      const genericTx = {
        from: TEST_ADDRESS,
        to: TEST_ADDRESS,
        data: '0x',
        value: '0',
        nonce: '0',
        gas: '21000',
        gasPrice: '1000000000',
        chainId: 1,
      };
      const result = toVincentTransaction(genericTx);
      expect(result.value).toBe('0x0');
      expect(result.nonce).toBe('0x0');
      expect(result.gas).toBe('0x5208');
      expect(result.gasPrice).toBe('0x3b9aca00');
    });

    it('should preserve hex values', () => {
      const genericTx = {
        from: TEST_ADDRESS,
        to: TEST_ADDRESS,
        data: '0x',
        value: '0x0',
        nonce: '0x0',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        chainId: 1,
      };
      const result = toVincentTransaction(genericTx);
      expect(result.value).toBe('0x0');
      expect(result.nonce).toBe('0x0');
      expect(result.gas).toBe('0x5208');
      expect(result.gasPrice).toBe('0x3b9aca00');
    });

    it('should convert chainId from hex to hex format', () => {
      const genericTx = {
        from: TEST_ADDRESS,
        to: TEST_ADDRESS,
        data: '0x',
        value: '0x0',
        nonce: '0x0',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        chainId: '0x1',
      };
      const result = toVincentTransaction(genericTx);
      expect(result.chainId).toBe('0x1');
    });

    it('should normalize accessList storage keys', () => {
      const genericTx = {
        from: TEST_ADDRESS,
        to: TEST_ADDRESS,
        data: '0x',
        value: '0x0',
        nonce: '0x0',
        gas: '0x5208',
        maxFeePerGas: '0x3b9aca00',
        maxPriorityFeePerGas: '0x3b9aca00',
        chainId: 1,
        accessList: [
          {
            address: TEST_ADDRESS,
            storageKeys: ['0x1', 2, '3'],
          },
        ],
      };
      const result = toVincentTransaction(genericTx);
      expect(result.accessList).toBeDefined();
      if (result.accessList) {
        expect(result.accessList[0].storageKeys[0]).toBe('0x1');
        expect(result.accessList[0].storageKeys[1]).toBe('0x2');
        expect(result.accessList[0].storageKeys[2]).toBe('0x3');
      }
    });
  });
});
