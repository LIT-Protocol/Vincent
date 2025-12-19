import { Address } from 'viem';

import { getRelayLinkExecuteAddresses } from './helpers/relay-link';
import { TransactionKind } from './helpers/transactionKind';
import { validateTransaction } from './validateTransaction';

const CHAIN_ID = 8453; // Base
const SENDER: Address = '0x1234567890123456789012345678901234567890';
const OTHER_ADDRESS: Address = '0x9999999999999999999999999999999999999999';
const relayAddresses = getRelayLinkExecuteAddresses(CHAIN_ID);
const RELAY_RECEIVER = relayAddresses[0];

describe('validateTransaction', () => {
  // Helper to create basic params
  const createParams = (decodedTransaction: any) => ({
    chainId: CHAIN_ID,
    sender: SENDER,
    decodedTransaction,
    transaction: {} as any,
    chain: {} as any,
  });

  describe('ERC20 Transactions', () => {
    it('should validate correct approval to Relay.link contract', () => {
      const decodedTransaction = {
        kind: TransactionKind.ERC20,
        fn: 'approve',
        args: [RELAY_RECEIVER, 1000000n],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).not.toThrow();
    });

    it('should validate correct increaseAllowance to Relay.link contract', () => {
      const decodedTransaction = {
        kind: TransactionKind.ERC20,
        fn: 'increaseAllowance',
        args: [RELAY_RECEIVER, 1000000n],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).not.toThrow();
    });

    it('should throw on approval to non-Relay.link spender', () => {
      const decodedTransaction = {
        kind: TransactionKind.ERC20,
        fn: 'approve',
        args: [OTHER_ADDRESS, 1000000n],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).toThrow(
        `ERC20 approval to non-Relay.link spender ${OTHER_ADDRESS}`,
      );
    });

    it('should throw on infinite approval', () => {
      const infiniteAmount = 2n ** 256n - 1n;
      const decodedTransaction = {
        kind: TransactionKind.ERC20,
        fn: 'approve',
        args: [RELAY_RECEIVER, infiniteAmount],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).toThrow(
        'Infinite approval not allowed',
      );
    });

    it('should not allow other ERC20 functions like transfer', () => {
      const decodedTransaction = {
        kind: TransactionKind.ERC20,
        fn: 'transfer',
        args: [OTHER_ADDRESS, 100n],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).toThrow(
        'ERC20 function transfer not allowed',
      );
    });

    it('should not allow transferFrom function', () => {
      const decodedTransaction = {
        kind: TransactionKind.ERC20,
        fn: 'transferFrom',
        args: [SENDER, OTHER_ADDRESS, 100n],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).toThrow(
        'ERC20 function transferFrom not allowed',
      );
    });
  });

  describe('Relay.link Transactions', () => {
    it('should validate transaction to primary Relay.link address', () => {
      const decodedTransaction = {
        kind: TransactionKind.RELAY_LINK,
        fn: 'execute',
        to: RELAY_RECEIVER,
        args: [],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).not.toThrow();
    });

    it('should validate transaction to alternative Relay.link address', () => {
      // Test with the second address if available
      if (relayAddresses.length > 1) {
        const decodedTransaction = {
          kind: TransactionKind.RELAY_LINK,
          fn: 'execute',
          to: relayAddresses[1],
          args: [],
        };

        expect(() => validateTransaction(createParams(decodedTransaction))).not.toThrow();
      }
    });

    it('should throw on transaction to non-Relay.link address', () => {
      const decodedTransaction = {
        kind: TransactionKind.RELAY_LINK,
        fn: 'execute',
        to: OTHER_ADDRESS,
        args: [],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).toThrow(
        `Transaction target ${OTHER_ADDRESS} is not a known Relay.link contract`,
      );
    });
  });

  describe('Error handling', () => {
    it('should throw on decoding error', () => {
      const decodedTransaction = {
        kind: 'error',
        message: 'ABI decode failed',
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).toThrow(
        'Transaction failed to decode: ABI decode failed',
      );
    });

    it('should throw on unknown transaction kind', () => {
      const decodedTransaction = {
        kind: 'unknown_kind',
        fn: 'someFn',
        args: [],
      };

      expect(() => validateTransaction(createParams(decodedTransaction))).toThrow(
        'Unknown transaction kind: unknown_kind',
      );
    });
  });
});
