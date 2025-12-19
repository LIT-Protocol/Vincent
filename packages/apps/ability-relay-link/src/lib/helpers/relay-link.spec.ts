import { Address, getAddress } from 'viem';

import { fetchRelayLinkAddresses, isRelayLinkAddress, isTestnet } from './relay-link';

describe('Relay.link Helpers', () => {
  describe('isTestnet', () => {
    it('should return false for mainnet chains', () => {
      expect(isTestnet(1)).toBe(false); // Ethereum
      expect(isTestnet(137)).toBe(false); // Polygon
      expect(isTestnet(8453)).toBe(false); // Base
      expect(isTestnet(42161)).toBe(false); // Arbitrum
      expect(isTestnet(10)).toBe(false); // Optimism
    });

    it('should return true for testnet chains', () => {
      expect(isTestnet(11155111)).toBe(true); // Sepolia
      expect(isTestnet(84532)).toBe(true); // Base Sepolia
      expect(isTestnet(421614)).toBe(true); // Arbitrum Sepolia
      expect(isTestnet(11155420)).toBe(true); // Optimism Sepolia
      expect(isTestnet(80002)).toBe(true); // Polygon Amoy
    });

    it('should return false for unknown chains', () => {
      expect(isTestnet(999999)).toBe(false);
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
