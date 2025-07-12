import { getTestContext } from '../testContext';
import { getAuthorizedRedirectUriByHash } from './getAuthorizedRedirectUriByHash';
import { keccak256, stringToBytes } from 'viem';

describe('getAuthorizedRedirectUriByHash', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });
  });

  it('should fetch redirect URI by hash', async () => {
    const redirectUri = testContext.AUTHORIZED_REDIRECT_URIS[0];

    // Create the hash in the same way it would be created in the contract
    const hashedRedirectUri = keccak256(stringToBytes(redirectUri));

    // Test getAuthorizedRedirectUriByHash
    const result = await getAuthorizedRedirectUriByHash(
      {
        hashedRedirectUri,
      },
      testContext.networkContext,
    );

    // Verify redirect URI
    expect(result).toBe(redirectUri);
  });

  it('should handle non-existent redirect URI hash', async () => {
    // Create a random hash that doesn't exist
    const nonExistentHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

    await expect(
      getAuthorizedRedirectUriByHash(
        {
          hashedRedirectUri: nonExistentHash,
        },
        testContext.networkContext,
      ),
    ).rejects.toThrow();
  });
});
