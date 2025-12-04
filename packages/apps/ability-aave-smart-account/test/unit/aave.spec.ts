import { describe, it, expect } from '@jest/globals';
import { getAddress } from 'viem';
import {
  getAaveAddresses,
  getATokens,
  getAvailableMarkets,
  getFeeContractAddress,
  CHAIN_TO_AAVE_ADDRESS_BOOK,
} from '../../src/lib/helpers/aave';

describe('aave helpers', () => {
  describe('getAaveAddresses', () => {
    it('should return addresses for supported mainnet chains', () => {
      const ethereum = getAaveAddresses(1);
      expect(ethereum.POOL).toBeDefined();
      expect(ethereum.POOL_ADDRESSES_PROVIDER).toBeDefined();
      expect(getAddress(ethereum.POOL)).toBe(ethereum.POOL);
    });

    it('should return addresses for supported testnet chains', () => {
      const sepolia = getAaveAddresses(11155111);
      expect(sepolia.POOL).toBeDefined();
      expect(sepolia.POOL_ADDRESSES_PROVIDER).toBeDefined();
    });

    it('should throw error for unsupported chains', () => {
      expect(() => getAaveAddresses(999999)).toThrow('Unsupported chain');
    });

    it('should return addresses for all supported chains', () => {
      const supportedChains = Object.keys(CHAIN_TO_AAVE_ADDRESS_BOOK).map(Number);
      for (const chainId of supportedChains) {
        const addresses = getAaveAddresses(chainId);
        expect(addresses.POOL).toBeDefined();
        expect(addresses.POOL_ADDRESSES_PROVIDER).toBeDefined();
      }
    });
  });

  describe('getATokens', () => {
    it('should return aTokens for supported chains', () => {
      const ethereum = getATokens(1);
      expect(typeof ethereum).toBe('object');
      expect(Object.keys(ethereum).length).toBeGreaterThan(0);

      // Verify all values are valid addresses
      for (const [key, address] of Object.entries(ethereum)) {
        expect(getAddress(address)).toBe(address);
      }
    });

    it('should throw error for unsupported chains', () => {
      expect(() => getATokens(999999)).toThrow('No ATokens available');
    });

    it('should return aTokens for testnet chains', () => {
      const sepolia = getATokens(11155111);
      expect(typeof sepolia).toBe('object');
    });
  });

  describe('getAvailableMarkets', () => {
    it('should return markets for supported chains', () => {
      const ethereum = getAvailableMarkets(1);
      expect(typeof ethereum).toBe('object');
      expect(Object.keys(ethereum).length).toBeGreaterThan(0);

      // Verify all values are valid addresses
      for (const [key, address] of Object.entries(ethereum)) {
        expect(getAddress(address)).toBe(address);
      }
    });

    it('should throw error for unsupported chains', () => {
      expect(() => getAvailableMarkets(999999)).toThrow('No markets available');
    });
  });

  describe('getFeeContractAddress', () => {
    it('should return fee contract address for supported chains', () => {
      const ethereum = getFeeContractAddress(1);
      expect(ethereum).toBeDefined();
      if (ethereum) {
        expect(getAddress(ethereum)).toBe(ethereum);
      }
    });

    it('should return null for unsupported chains', () => {
      const unsupported = getFeeContractAddress(999999);
      expect(unsupported).toBeNull();
    });

    it('should return fee contract for base sepolia', () => {
      const baseSepolia = getFeeContractAddress(84532);
      expect(baseSepolia).toBeDefined();
      if (baseSepolia) {
        expect(getAddress(baseSepolia)).toBe(baseSepolia);
      }
    });
  });
});
