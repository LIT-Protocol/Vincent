import { Address } from 'viem';

import {
  getAaveAddresses,
  getATokens,
  getAvailableMarkets,
  getAaveApprovalTx,
  getAaveSupplyTx,
  getAaveWithdrawTx,
  getAaveBorrowTx,
  getAaveRepayTx,
  getFeeContractAddress,
  CHAIN_TO_AAVE_ADDRESS_BOOK,
} from './aave';

const CHAIN_ID = 8453; // Base
const TEST_ACCOUNT: Address = '0x1234567890123456789012345678901234567890';
const TEST_ASSET: Address = '0x0000000000000000000000000000000000000001';
const feeContractAddress = getFeeContractAddress(CHAIN_ID);

describe('Aave Helpers', () => {
  describe('getAaveAddresses', () => {
    it('should return correct addresses for a supported chain', () => {
      const addresses = getAaveAddresses(CHAIN_ID);
      expect(addresses).toBeDefined();
      expect(addresses.POOL).toBeDefined();
      expect(addresses.POOL_ADDRESSES_PROVIDER).toBeDefined();
      expect(addresses.POOL).toBe(CHAIN_TO_AAVE_ADDRESS_BOOK[CHAIN_ID].POOL);
    });

    it('should throw error for unsupported chain', () => {
      expect(() => getAaveAddresses(999999)).toThrow('Unsupported chain: 999999');
    });
  });

  describe('getATokens', () => {
    it('should return ATokens for a supported chain', () => {
      const aTokens = getATokens(CHAIN_ID);
      expect(aTokens).toBeDefined();
      // We expect at least some tokens to be present
      expect(Object.keys(aTokens).length).toBeGreaterThan(0);
    });

    it('should throw error for unsupported chain', () => {
      expect(() => getATokens(999999)).toThrow('No ATokens available for chain: 999999');
    });
  });

  describe('getAvailableMarkets', () => {
    it('should return markets for a supported chain', () => {
      const markets = getAvailableMarkets(CHAIN_ID);
      expect(markets).toBeDefined();
      expect(Object.keys(markets).length).toBeGreaterThan(0);
    });

    it('should throw error for unsupported chain', () => {
      expect(() => getAvailableMarkets(999999)).toThrow('No markets available for chain: 999999');
    });
  });

  describe('Transaction Generators', () => {
    it('getAaveApprovalTx should generate correct transaction', async () => {
      const tx = getAaveApprovalTx({
        accountAddress: TEST_ACCOUNT,
        assetAddress: TEST_ASSET,
        chainId: CHAIN_ID,
        amount: '100',
      });

      expect(tx).toBeDefined();
      expect(tx.from).toBe(TEST_ACCOUNT);
      expect(tx.to).toBe(TEST_ASSET);
      expect(tx.value).toBe('0x0');
      expect(tx.data).toBeDefined();
    });

    it('getAaveSupplyTx should generate correct transaction', async () => {
      const tx = getAaveSupplyTx({
        accountAddress: TEST_ACCOUNT,
        appId: 123,
        assetAddress: TEST_ASSET,
        chainId: CHAIN_ID,
        amount: '100',
      });

      expect(tx).toBeDefined();
      expect(tx.from).toBe(TEST_ACCOUNT);
      expect(tx.to).toBe(feeContractAddress);
      expect(tx.value).toBe('0x0');
      expect(tx.data).toBeDefined();
    });

    it('getAaveWithdrawTx should generate correct transaction', async () => {
      const tx = getAaveWithdrawTx({
        accountAddress: TEST_ACCOUNT,
        appId: 123,
        assetAddress: TEST_ASSET,
        chainId: CHAIN_ID,
        amount: '100',
      });

      expect(tx).toBeDefined();
      expect(tx.from).toBe(TEST_ACCOUNT);
      expect(tx.to).toBe(feeContractAddress);
      expect(tx.value).toBe('0x0');
      expect(tx.data).toBeDefined();
    });

    it('getAaveBorrowTx should generate correct transaction', async () => {
      const tx = getAaveBorrowTx({
        accountAddress: TEST_ACCOUNT,
        amount: '100',
        assetAddress: TEST_ASSET,
        chainId: CHAIN_ID,
        interestRateMode: 1,
      });
      const { POOL } = getAaveAddresses(CHAIN_ID);

      expect(tx).toBeDefined();
      expect(tx.from).toBe(TEST_ACCOUNT);
      expect(tx.to).toBe(POOL);
      expect(tx.value).toBe('0x0');
      expect(tx.data).toBeDefined();
    });

    it('getAaveRepayTx should generate correct transaction', async () => {
      const tx = getAaveRepayTx({
        accountAddress: TEST_ACCOUNT,
        amount: '100',
        assetAddress: TEST_ASSET,
        chainId: CHAIN_ID,
        interestRateMode: 1,
      });
      const { POOL } = getAaveAddresses(CHAIN_ID);

      expect(tx).toBeDefined();
      expect(tx.from).toBe(TEST_ACCOUNT);
      expect(tx.to).toBe(POOL);
      expect(tx.value).toBe('0x0');
      expect(tx.data).toBeDefined();
    });
  });
});
