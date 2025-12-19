import { DecodeTransactionParams } from '@lit-protocol/vincent-ability-sdk/gatedSigner';
import { Address, encodeFunctionData } from 'viem';

import { decodeTransaction } from './decodeTransaction';
import { ERC20_ABI } from './helpers/erc20';
import { fetchRelayLinkAddresses } from './helpers/relay-link';
import { TransactionKind } from './helpers/transactionKind';

const CHAIN_ID = 8453; // Base
const TEST_ACCOUNT: Address = '0x1234567890123456789012345678901234567890';
const TEST_TOKEN: Address = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base

// Relay addresses are fetched async, so we need to load them before tests
let RELAY_ADDRESS: Address;

beforeAll(async () => {
  const relayAddresses = await fetchRelayLinkAddresses(CHAIN_ID);
  RELAY_ADDRESS = relayAddresses[0];
});

describe('decodeTransaction', () => {
  describe('ERC20 transactions', () => {
    it('should decode ERC20 approve transaction', () => {
      const amount = 1000000n; // 1 USDC
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [RELAY_ADDRESS, amount],
      });

      const params: DecodeTransactionParams = {
        transaction: {
          to: TEST_TOKEN,
          value: 0n,
          data,
        },
      };

      const decoded = decodeTransaction(params);

      expect(decoded.kind).toBe(TransactionKind.ERC20);
      if (decoded.kind === TransactionKind.ERC20) {
        expect(decoded.fn).toBe('approve');
        expect(decoded.args).toBeDefined();
        const [spender, decodedAmount] = decoded.args as [Address, bigint];
        expect(spender.toLowerCase()).toBe(RELAY_ADDRESS.toLowerCase());
        expect(decodedAmount).toBe(amount);
      }
    });

    it('should decode ERC20 increaseAllowance transaction', () => {
      const amount = 500000n;
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'increaseAllowance',
        args: [RELAY_ADDRESS, amount],
      });

      const params: DecodeTransactionParams = {
        transaction: {
          to: TEST_TOKEN,
          value: 0n,
          data,
        },
      };

      const decoded = decodeTransaction(params);

      expect(decoded.kind).toBe(TransactionKind.ERC20);
      if (decoded.kind === TransactionKind.ERC20) {
        expect(decoded.fn).toBe('increaseAllowance');
        expect(decoded.args).toBeDefined();
        const [spender, decodedAmount] = decoded.args as [Address, bigint];
        expect(spender.toLowerCase()).toBe(RELAY_ADDRESS.toLowerCase());
        expect(decodedAmount).toBe(amount);
      }
    });
  });

  describe('Relay.link transactions', () => {
    it('should decode unknown transaction as RELAY_LINK', () => {
      // Non-ERC20 calldata - will be treated as Relay.link transaction
      const params: DecodeTransactionParams = {
        transaction: {
          to: RELAY_ADDRESS,
          value: 0n,
          data: '0x12345678abcdef', // Random calldata
        },
      };

      const decoded = decodeTransaction(params);

      expect(decoded.kind).toBe(TransactionKind.RELAY_LINK);
      if (decoded.kind === TransactionKind.RELAY_LINK) {
        expect(decoded.fn).toBe('execute');
        expect(decoded.to).toBe(RELAY_ADDRESS);
      }
    });

    it('should decode transaction with ETH value as RELAY_LINK', () => {
      const params: DecodeTransactionParams = {
        transaction: {
          to: RELAY_ADDRESS,
          value: 1000000000000000000n, // 1 ETH
          data: '0xabcdef',
        },
      };

      const decoded = decodeTransaction(params);

      expect(decoded.kind).toBe(TransactionKind.RELAY_LINK);
      if (decoded.kind === TransactionKind.RELAY_LINK) {
        expect(decoded.fn).toBe('execute');
        expect(decoded.value).toBe(1000000000000000000n);
      }
    });

    it('should decode empty data transaction as RELAY_LINK', () => {
      const params: DecodeTransactionParams = {
        transaction: {
          to: TEST_ACCOUNT,
          value: 0n,
          data: '0x',
        },
      };

      const decoded = decodeTransaction(params);

      expect(decoded.kind).toBe(TransactionKind.RELAY_LINK);
      if (decoded.kind === TransactionKind.RELAY_LINK) {
        expect(decoded.fn).toBe('execute');
      }
    });
  });
});
