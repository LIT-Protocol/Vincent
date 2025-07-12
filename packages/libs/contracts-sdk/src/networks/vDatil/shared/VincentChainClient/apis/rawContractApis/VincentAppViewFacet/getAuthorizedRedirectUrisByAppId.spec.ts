import { getTestContext } from '../testContext';
import { getAuthorizedRedirectUrisByAppId } from './getAuthorizedRedirectUrisByAppId';

describe('getAuthorizedRedirectUrisByAppId', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });
  });

  it('should fetch all authorized redirect URIs for an app', async () => {
    const { appId } = testContext.registerAppRes;

    // Test getAuthorizedRedirectUrisByAppId
    const result = await getAuthorizedRedirectUrisByAppId(
      {
        appId,
      },
      testContext.networkContext,
    );

    // Verify that all redirect URIs are returned
    expect(result).toEqual(testContext.AUTHORIZED_REDIRECT_URIS);
    expect(result.length).toBe(testContext.AUTHORIZED_REDIRECT_URIS.length);
  });

  it('should handle non-existent app', async () => {
    await expect(
      getAuthorizedRedirectUrisByAppId(
        {
          appId: testContext.failCase.nonExistentAppId,
        },
        testContext.networkContext,
      ),
    ).rejects.toThrow();
  });
});
