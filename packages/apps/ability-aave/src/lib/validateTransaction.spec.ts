import { validateTransaction } from './validateTransaction';
import { TransactionKind } from './helpers/transactionKind';
import { getFeeContractAddress } from './helpers/aave';
import { Address } from 'viem';

// Mock types since we might not have full access to the sdk types in this test context easily without importing everything
// or if they are complex. But we try to import them if possible.
// Based on file content provided in history, they are imported from @lit-protocol/vincent-ability-sdk/gatedSigner
// We will try to rely on the structure expected by the function.

const CHAIN_ID = 8453; // Base
const SENDER: Address = '0x1234567890123456789012345678901234567890';
const OTHER_ADDRESS: Address = '0x9999999999999999999999999999999999999999';
const feeContractAddress = getFeeContractAddress(CHAIN_ID);

describe('validateTransaction', () => {
  // Helper to create basic params
  const createParams = (decodedTransaction: any) => ({
    chainId: CHAIN_ID,
    sender: SENDER,
    decodedTransaction,
    transaction: {} as any, // Unused in function
    chain: {} as any, // Unused in function
  });

  describe('ERC20 Transactions', () => {
    it('should validate correct approval to Aave Pool', () => {
      const decodedTransaction = {
        kind: TransactionKind.ERC20,
        fn: 'approve',
        args: [feeContractAddress, 1000n],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).not.toThrow();
    });

    it('should validate correct increaseAllowance to Aave Pool', () => {
      const decodedTransaction = {
        kind: TransactionKind.ERC20,
        fn: 'increaseAllowance',
        args: [feeContractAddress, 1000n],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).not.toThrow();
    });

    it('should throw on approval to forbidden spender', () => {
      const decodedTransaction = {
        kind: TransactionKind.ERC20,
        fn: 'approve',
        args: [OTHER_ADDRESS, 1000n],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).toThrow(
        `ERC20 approval to forbidden spender ${OTHER_ADDRESS}`,
      );
    });

    it('should throw on infinite approval', () => {
      const infiniteAmount = 2n ** 256n - 1n;
      const decodedTransaction = {
        kind: TransactionKind.ERC20,
        fn: 'approve',
        args: [feeContractAddress, infiniteAmount],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).toThrow(
        'Infinite approval not allowed',
      );
    });

    it('should not allow other ERC20 functions', () => {
      const decodedTransaction = {
        kind: TransactionKind.ERC20,
        fn: 'transfer',
        args: [OTHER_ADDRESS, 100n],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).toThrow(
        'ERC20 function not allowed',
      );
    });
  });

  describe('Aave Transactions', () => {
    it('should validate correct supply', () => {
      const decodedTransaction = {
        kind: TransactionKind.AAVE,
        fn: 'supply',
        args: [OTHER_ADDRESS, 100n, SENDER, 0], // supply(asset, amount, onBehalfOf, referralCode)
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).not.toThrow();
    });

    it('should throw on supply with invalid onBehalfOf', () => {
      const decodedTransaction = {
        kind: TransactionKind.AAVE,
        fn: 'supply',
        args: [OTHER_ADDRESS, 100n, OTHER_ADDRESS, 0],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).toThrow(
        'supply.onBehalfOf != sender',
      );
    });

    it('should validate correct withdraw', () => {
      const decodedTransaction = {
        kind: TransactionKind.AAVE,
        fn: 'withdraw',
        args: [OTHER_ADDRESS, 100n, SENDER], // withdraw(asset, amount, to)
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).not.toThrow();
    });

    it('should throw on withdraw with invalid to', () => {
      const decodedTransaction = {
        kind: TransactionKind.AAVE,
        fn: 'withdraw',
        args: [OTHER_ADDRESS, 100n, OTHER_ADDRESS],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).toThrow(
        'withdraw.to != sender',
      );
    });

    it('should validate correct borrow', () => {
      const decodedTransaction = {
        kind: TransactionKind.AAVE,
        fn: 'borrow',
        args: [OTHER_ADDRESS, 100n, 2n, 0, SENDER], // borrow(asset, amount, interestRateMode, referralCode, onBehalfOf)
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).not.toThrow();
    });

    it('should throw on borrow with invalid onBehalfOf', () => {
      const decodedTransaction = {
        kind: TransactionKind.AAVE,
        fn: 'borrow',
        args: [OTHER_ADDRESS, 100n, 2n, 0, OTHER_ADDRESS],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).toThrow(
        'borrow.onBehalfOf != sender',
      );
    });

    it('should validate correct repay', () => {
      const decodedTransaction = {
        kind: TransactionKind.AAVE,
        fn: 'repay',
        args: [OTHER_ADDRESS, 100n, 2n, SENDER], // repay(asset, amount, interestRateMode, onBehalfOf)
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).not.toThrow();
    });

    it('should throw on repay with invalid onBehalfOf', () => {
      const decodedTransaction = {
        kind: TransactionKind.AAVE,
        fn: 'repay',
        args: [OTHER_ADDRESS, 100n, 2n, OTHER_ADDRESS],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).toThrow(
        'repay.onBehalfOf != sender',
      );
    });

    it('should validate setUserUseReserveAsCollateral', () => {
      const decodedTransaction = {
        kind: TransactionKind.AAVE,
        fn: 'setUserUseReserveAsCollateral',
        args: [OTHER_ADDRESS, true],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).not.toThrow();
    });

    it('should throw on unknown Aave function', () => {
      const decodedTransaction = {
        kind: TransactionKind.AAVE,
        fn: 'flashLoan',
        args: [],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).toThrow(
        'Aave Pool function not allowed: flashLoan',
      );
    });
  });

  describe('Error handling', () => {
    it('should throw on decoding error', () => {
      const decodedTransaction = {
        kind: 'error',
        message: 'ABI mismatch',
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).toThrow(
        'Transaction failed to decode: ABI mismatch',
      );
    });

    it('should throw on unknown transaction kind', () => {
      const decodedTransaction = {
        kind: 'unknown_kind',
        fn: 'someFn',
        args: [],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).toThrow(
        'Unknown decoded transaction kind. Could not validate transaction.',
      );
    });
  });
});
