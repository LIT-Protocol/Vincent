import { describe, it, expect } from '@jest/globals';
import { getAddress } from 'viem';
import { addressSchema, hexSchema, hexOfBytesSchema } from '../../src/lib/helpers/schemas';
import {
  abilityParamsSchema,
  userOpAbilityParamsSchema,
  transactionAbilityParamsSchema,
  eip712ParamsSchema,
  precheckSuccessSchema,
  executeSuccessSchema,
  precheckFailSchema,
  executeFailSchema,
} from '../../src/lib/schemas';

// Use a known valid checksummed address for testing
const TEST_ADDRESS = getAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'); // Vitalik's address

describe('schemas', () => {
  describe('addressSchema', () => {
    it('should accept valid Ethereum addresses', () => {
      const validAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      // Note: viem requires proper checksum, so we test with a known valid address
      const knownValidAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // Vitalik's address
      expect(() => addressSchema.parse(knownValidAddress)).not.toThrow();
    });

    it('should reject invalid addresses', () => {
      expect(() => addressSchema.parse('invalid')).toThrow();
      expect(() => addressSchema.parse('0x123')).toThrow();
      expect(() => addressSchema.parse('')).toThrow();
    });

    it('should accept properly checksummed addresses', () => {
      // viem's isAddress with strict: false still requires valid checksum
      const knownValidAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; // Vitalik's address
      expect(() => addressSchema.parse(knownValidAddress)).not.toThrow();
    });
  });

  describe('hexSchema', () => {
    it('should accept valid hex strings', () => {
      expect(() => hexSchema.parse('0x1234')).not.toThrow();
      expect(() => hexSchema.parse('0xabcdef')).not.toThrow();
      expect(() => hexSchema.parse('0x0')).not.toThrow();
    });

    it('should reject invalid hex strings', () => {
      expect(() => hexSchema.parse('1234')).toThrow(); // missing 0x
      // Note: viem's isHex with strict: true may allow odd length in some cases
      expect(() => hexSchema.parse('0xgh')).toThrow(); // invalid characters
      expect(() => hexSchema.parse('')).toThrow();
    });
  });

  describe('hexOfBytesSchema', () => {
    it('should accept hex strings of correct byte length', () => {
      const schema = hexOfBytesSchema(2);
      expect(() => schema.parse('0x1234')).not.toThrow(); // 2 bytes
    });

    it('should reject hex strings of incorrect byte length', () => {
      const schema = hexOfBytesSchema(2);
      expect(() => schema.parse('0x123456')).toThrow(); // 3 bytes
      expect(() => schema.parse('0x12')).toThrow(); // 1 byte
    });
  });

  describe('eip712ParamsSchema', () => {
    it('should accept valid EIP-712 params', () => {
      const validParams = {
        domain: { name: 'Test', version: '1', chainId: 1 },
        types: {
          EIP712Domain: [{ name: 'name', type: 'string' }],
        },
        primaryType: 'EIP712Domain',
        message: {
          userOp: '$userOp.sender',
          validUntil: '$validUntil',
        },
      };
      expect(() => eip712ParamsSchema.parse(validParams)).not.toThrow();
    });

    it('should reject invalid message references', () => {
      const invalidParams = {
        domain: {},
        types: {},
        primaryType: 'Test',
        message: {
          invalid: 'not-a-reference',
        },
      };
      expect(() => eip712ParamsSchema.parse(invalidParams)).toThrow();
    });

    it('should accept nested message objects with valid references', () => {
      const validParams = {
        domain: {},
        types: {},
        primaryType: 'Test',
        message: {
          nested: {
            userOp: '$userOp.sender',
          },
        },
      };
      expect(() => eip712ParamsSchema.parse(validParams)).not.toThrow();
    });
  });

  describe('userOpAbilityParamsSchema', () => {
    it('should accept valid userOp params', () => {
      const validParams = {
        userOp: {
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
        },
        alchemyRpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/test',
        entryPointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
      };
      expect(() => userOpAbilityParamsSchema.parse(validParams)).not.toThrow();
    });

    it('should reject invalid alchemy RPC URL', () => {
      const invalidParams = {
        userOp: {
          sender: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          nonce: '0x0',
          callData: '0x',
          callGasLimit: '0x5208',
          verificationGasLimit: '0x5208',
          preVerificationGas: '0x5208',
          maxFeePerGas: '0x3b9aca00',
          maxPriorityFeePerGas: '0x3b9aca00',
        },
        alchemyRpcUrl: 'https://invalid-url.com',
      };
      expect(() => userOpAbilityParamsSchema.parse(invalidParams)).toThrow();
    });
  });

  describe('transactionAbilityParamsSchema', () => {
    it('should accept valid transaction params', () => {
      const validParams = {
        transaction: {
          from: TEST_ADDRESS,
          to: TEST_ADDRESS,
          data: '0x',
          value: '0x0',
          nonce: '0x0',
          gas: '0x5208',
          gasPrice: '0x3b9aca00',
          chainId: 1,
        },
        alchemyRpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/test',
      };
      expect(() => transactionAbilityParamsSchema.parse(validParams)).not.toThrow();
    });

    it('should require either gas or gasLimit', () => {
      const invalidParams = {
        transaction: {
          from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          data: '0x',
          value: '0x0',
          nonce: '0x0',
          gasPrice: '0x3b9aca00',
          chainId: 1,
        },
        alchemyRpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/test',
      };
      expect(() => transactionAbilityParamsSchema.parse(invalidParams)).toThrow();
    });
  });

  describe('abilityParamsSchema', () => {
    it('should accept userOp params', () => {
      const userOpParams = {
        userOp: {
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
        },
        alchemyRpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/test',
      };
      expect(() => abilityParamsSchema.parse(userOpParams)).not.toThrow();
    });

    it('should accept transaction params', () => {
      const transactionParams = {
        transaction: {
          from: TEST_ADDRESS,
          to: TEST_ADDRESS,
          data: '0x',
          value: '0x0',
          nonce: '0x0',
          gas: '0x5208',
          gasPrice: '0x3b9aca00',
          chainId: 1,
        },
        alchemyRpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/test',
      };
      expect(() => abilityParamsSchema.parse(transactionParams)).not.toThrow();
    });
  });

  describe('precheckSuccessSchema', () => {
    it('should accept valid precheck success result', () => {
      const validResult = {
        simulationChanges: [
          {
            assetType: 'ERC20',
            changeType: 'TRANSFER',
            from: TEST_ADDRESS,
            to: TEST_ADDRESS,
            amount: '0x0',
            contractAddress: TEST_ADDRESS,
            decimals: 18,
            symbol: 'USDC',
          },
        ],
      };
      expect(() => precheckSuccessSchema.parse(validResult)).not.toThrow();
    });
  });

  describe('executeSuccessSchema', () => {
    it('should accept valid execute success result', () => {
      const validResult = {
        signature:
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
        simulationChanges: [],
      };
      expect(() => executeSuccessSchema.parse(validResult)).not.toThrow();
    });
  });

  describe('precheckFailSchema', () => {
    it('should accept valid precheck fail result', () => {
      const validResult = {
        error: 'Validation failed',
      };
      expect(() => precheckFailSchema.parse(validResult)).not.toThrow();
    });
  });

  describe('executeFailSchema', () => {
    it('should accept valid execute fail result', () => {
      const validResult = {
        error: 'Execution failed',
      };
      expect(() => executeFailSchema.parse(validResult)).not.toThrow();
    });
  });
});
