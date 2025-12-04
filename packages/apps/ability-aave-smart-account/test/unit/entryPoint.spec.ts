import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createPublicClient, http, type PublicClient } from 'viem';
import { assertValidEntryPointAddress } from '../../src/lib/helpers/entryPoint';

describe('entryPoint helpers', () => {
  let mockPublicClient: PublicClient;

  beforeEach(() => {
    mockPublicClient = createPublicClient({
      transport: http('https://eth-mainnet.g.alchemy.com/v2/test'),
    }) as PublicClient;
  });

  describe('assertValidEntryPointAddress', () => {
    it('should pass when entry point is supported', async () => {
      const supportedEntryPoints = ['0x0000000071727De22E5E9d8BAf0edAc6f37da032'];
      const client = {
        ...mockPublicClient,
        request: jest.fn().mockResolvedValue(supportedEntryPoints),
      } as unknown as PublicClient;

      await expect(
        assertValidEntryPointAddress('0x0000000071727De22E5E9d8BAf0edAc6f37da032', client),
      ).resolves.toBe(true);
    });

    it('should throw when entry point is not supported', async () => {
      const supportedEntryPoints = ['0x0000000071727De22E5E9d8BAf0edAc6f37da032'];
      const client = {
        ...mockPublicClient,
        request: jest.fn().mockResolvedValue(supportedEntryPoints),
      } as unknown as PublicClient;

      await expect(
        assertValidEntryPointAddress('0x1234567890123456789012345678901234567890', client),
      ).rejects.toThrow('Entry point not supported');
    });

    it('should handle empty supported entry points list', async () => {
      const client = {
        ...mockPublicClient,
        request: jest.fn().mockResolvedValue([]),
      } as unknown as PublicClient;

      await expect(
        assertValidEntryPointAddress('0x0000000071727De22E5E9d8BAf0edAc6f37da032', client),
      ).rejects.toThrow('Entry point not supported');
    });
  });
});
