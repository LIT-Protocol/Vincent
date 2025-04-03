import { vincentNetworkContext } from '../../../NetworkContextManager';
import { getTestContext } from '../testContext';
import { getAppById } from './getAppById';

describe('getAppById', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });
  });

  it('should fetch app details', async () => {
    const { appId } = testContext.registerAppRes;

    // Now test getAppById
    const result = await getAppById(
      {
        appId,
      },
      testContext.networkContext,
    );

    console.log('result:', result);

    // Verify app details
    expect(result.id).toBe(appId);
    expect(result.name).toBe(testContext.APP_NAME);
    expect(result.description).toBe(testContext.APP_DESCRIPTION);
    expect(result.manager).toBeDefined();
    expect(result.authorizedRedirectUris).toEqual(
      testContext.AUTHORIZED_REDIRECT_URIS,
    );
    expect(result.delegatees).toContain(testContext.DELEGATEES[0]);
    expect(Number(result.latestVersion)).toBe(1);
  });

  it('should handle non-existent app', async () => {
    await expect(
      getAppById(
        {
          appId: testContext.failCase.nonExistentAppId,
        },
        vincentNetworkContext,
      ),
    ).rejects.toThrow();
  });
});
