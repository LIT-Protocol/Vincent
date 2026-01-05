import { Address, getAddress } from 'viem';

import { fetchRelayLinkAddresses, isRelayLinkAddress, isTestnet } from './relay-link';

describe('Relay.link Helpers', () => {
  describe('isTestnet', () => {
    it('should return false for mainnet chains', async () => {
      expect(await isTestnet(1)).toBe(false); // Ethereum
      expect(await isTestnet(137)).toBe(false); // Polygon
      expect(await isTestnet(8453)).toBe(false); // Base
      expect(await isTestnet(42161)).toBe(false); // Arbitrum
      expect(await isTestnet(10)).toBe(false); // Optimism
    });

    it('should return true for testnet chains', async () => {
      expect(await isTestnet(1337)).toBe(true); // Hyperliquid Testnet
      expect(await isTestnet(84532)).toBe(true); // Base Sepolia
      expect(await isTestnet(11155111)).toBe(true); // Sepolia
    });

    it('should return false for unknown chains', async () => {
      expect(await isTestnet(999999)).toBe(false);
    });
  });

  describe('fetchRelayLinkAddresses', () => {
    it('should return addresses for supported mainnet chains', async () => {
      const baseAddresses = await fetchRelayLinkAddresses(8453);
      expect(baseAddresses).toBeDefined();
      expect(baseAddresses.length).toBeGreaterThan(0);
    });

    it('should return addresses for supported testnet chains', async () => {
      const baseSepoliaAddresses = await fetchRelayLinkAddresses(84532);
      expect(baseSepoliaAddresses).toBeDefined();
      expect(baseSepoliaAddresses.length).toBeGreaterThan(0);
    });

    it('should throw error for unsupported chain', async () => {
      await expect(fetchRelayLinkAddresses(999999)).rejects.toThrow();
    });

    it('should return valid checksummed addresses', async () => {
      const addresses = await fetchRelayLinkAddresses(8453);
      addresses.forEach((addr) => {
        expect(addr).toBe(getAddress(addr));
      });
    });
  });

  describe('isRelayLinkAddress', () => {
    it('should return true for valid Relay.link addresses', async () => {
      const baseAddresses = await fetchRelayLinkAddresses(8453);

      for (const addr of baseAddresses) {
        expect(await isRelayLinkAddress(addr, 8453)).toBe(true);
      }
    });

    it('should return true for lowercase addresses', async () => {
      const addresses = await fetchRelayLinkAddresses(8453);
      const address = addresses[0];
      expect(await isRelayLinkAddress(address.toLowerCase() as Address, 8453)).toBe(true);
    });

    it('should return false for non-Relay.link addresses', async () => {
      const randomAddress: Address = '0x1234567890123456789012345678901234567890';
      expect(await isRelayLinkAddress(randomAddress, 8453)).toBe(false);
    });

    it('should return false for unsupported chains', async () => {
      const addresses = await fetchRelayLinkAddresses(8453);
      const address = addresses[0];
      expect(await isRelayLinkAddress(address, 999999)).toBe(false);
    });
  });
});
