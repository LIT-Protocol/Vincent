import { Address } from 'viem';

import { fetchRelayLinkAddresses } from './helpers/relay-link';
import { TransactionKind } from './helpers/transactionKind';
import { validateTransaction } from './validateTransaction';

const CHAIN_ID = 8453; // Base
const SENDER: Address = '0x1234567890123456789012345678901234567890';
const OTHER_ADDRESS: Address = '0x9999999999999999999999999999999999999999';

// Relay addresses are fetched async, so we need to load them before tests
let relayAddresses: Address[];
let RELAY_RECEIVER: Address;

beforeAll(async () => {
  relayAddresses = await fetchRelayLinkAddresses(CHAIN_ID);
  RELAY_RECEIVER = relayAddresses[0];
});

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
    it('should validate correct approval to Relay.link contract', async () => {
      const decodedTransaction = {
        kind: TransactionKind.ERC20,
        fn: 'approve',
        args: [RELAY_RECEIVER, 1000000n],
      };

      await expect(validateTransaction(createParams(decodedTransaction))).resolves.not.toThrow();
    });

    it('should validate correct increaseAllowance to Relay.link contract', async () => {
      const decodedTransaction = {
        kind: TransactionKind.ERC20,
        fn: 'increaseAllowance',
        args: [RELAY_RECEIVER, 1000000n],
      };

      await expect(validateTransaction(createParams(decodedTransaction))).resolves.not.toThrow();
    });

    it('should throw on approval to non-Relay.link spender', async () => {
      const decodedTransaction = {
        kind: TransactionKind.ERC20,
        fn: 'approve',
        args: [OTHER_ADDRESS, 1000000n],
      };

      await expect(validateTransaction(createParams(decodedTransaction))).rejects.toThrow(
        `ERC20 approval to non-Relay.link spender ${OTHER_ADDRESS}`,
      );
    });

    it('should throw on infinite approval', async () => {
      const infiniteAmount = 2n ** 256n - 1n;
      const decodedTransaction = {
        kind: TransactionKind.ERC20,
        fn: 'approve',
        args: [RELAY_RECEIVER, infiniteAmount],
      };

      await expect(validateTransaction(createParams(decodedTransaction))).rejects.toThrow(
        'Infinite approval not allowed',
      );
    });

    it('should not allow other ERC20 functions like transfer', async () => {
      const decodedTransaction = {
        kind: TransactionKind.ERC20,
        fn: 'transfer',
        args: [OTHER_ADDRESS, 100n],
      };

      await expect(validateTransaction(createParams(decodedTransaction))).rejects.toThrow(
        'ERC20 function transfer not allowed',
      );
    });

    it('should not allow transferFrom function', async () => {
      const decodedTransaction = {
        kind: TransactionKind.ERC20,
        fn: 'transferFrom',
        args: [SENDER, OTHER_ADDRESS, 100n],
      };

      await expect(validateTransaction(createParams(decodedTransaction))).rejects.toThrow(
        'ERC20 function transferFrom not allowed',
      );
    });
  });

  describe('Relay.link Transactions', () => {
    it('should validate transaction to primary Relay.link address', async () => {
      const decodedTransaction = {
        kind: TransactionKind.RELAY_LINK,
        fn: 'execute',
        to: RELAY_RECEIVER,
        args: [],
      };

      await expect(validateTransaction(createParams(decodedTransaction))).resolves.not.toThrow();
    });

    it('should validate transaction to alternative Relay.link address', async () => {
      // Test with the second address if available
      if (relayAddresses.length > 1) {
        const decodedTransaction = {
          kind: TransactionKind.RELAY_LINK,
          fn: 'execute',
          to: relayAddresses[1],
          args: [],
        };

        await expect(validateTransaction(createParams(decodedTransaction))).resolves.not.toThrow();
      }
    });

    it('should throw on transaction to non-Relay.link address', async () => {
      const decodedTransaction = {
        kind: TransactionKind.RELAY_LINK,
        fn: 'execute',
        to: OTHER_ADDRESS,
        args: [],
      };

      await expect(validateTransaction(createParams(decodedTransaction))).rejects.toThrow(
        `Transaction target ${OTHER_ADDRESS} is not a known Relay.link contract`,
      );
    });
  });

  describe('Error handling', () => {
    it('should throw on decoding error', async () => {
      const decodedTransaction = {
        kind: 'error',
        message: 'ABI decode failed',
      };

      await expect(validateTransaction(createParams(decodedTransaction))).rejects.toThrow(
        'Transaction failed to decode: ABI decode failed',
      );
    });

    it('should throw on unknown transaction kind', async () => {
      const decodedTransaction = {
        kind: 'unknown_kind',
        fn: 'someFn',
        args: [],
      };

      await expect(validateTransaction(createParams(decodedTransaction))).rejects.toThrow(
        'Unknown transaction kind: unknown_kind',
      );
    });
  });
});
