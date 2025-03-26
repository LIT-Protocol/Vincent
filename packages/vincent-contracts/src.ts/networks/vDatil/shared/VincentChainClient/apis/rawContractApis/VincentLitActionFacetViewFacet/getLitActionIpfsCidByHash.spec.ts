import { keccak256, stringToHex } from 'viem';
import { getTestContext } from '../testContext';
import { getLitActionIpfsCidByHash } from './getLitActionIpfsCidByHash';

describe('getLitActionIpfsCidByHash', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  // Create a unique IPFS CID for this test to avoid collisions
  const testIpfsCid = `QmTest${Math.random().toString(36).substring(2, 10)}`;
  let litActionIpfsCidHash: `0x${string}`;

  beforeAll(async () => {
    testContext = await getTestContext();

    // Calculate the hash the same way the contract does
    litActionIpfsCidHash = keccak256(stringToHex(testIpfsCid));
  });

  it('should retrieve a lit action IPFS CID by its hash from the Vincent network', async () => {
    const result = await getLitActionIpfsCidByHash(
      {
        litActionIpfsCidHash,
      },
      testContext.networkContext,
    );

    // Log the result for debugging
    console.log(JSON.stringify(result, null, 2));

    // Verify structure of the response
    expect(result).toHaveProperty('litActionIpfsCid');

    // Verify the returned IPFS CID matches what we registered
    expect(result.litActionIpfsCid).toBe(testIpfsCid);
  });
});
