import { ethers } from 'ethers';

import { assertValidEntryPointAddress } from '../../src/lib/helpers/entryPoint';
import { ENTRY_POINT, RPC_URL } from '../helpers/test-variables';

describe('assertValidEntryPointAddress', () => {
  it('resolves true when the entry point is supported', async () => {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    await expect(assertValidEntryPointAddress(ENTRY_POINT, provider)).resolves.toBe(true);
  });

  it('throws when the entry point is not supported', async () => {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    await expect(assertValidEntryPointAddress('0x123', provider)).rejects.toThrow(
      'Entry point not supported',
    );
  });
});
