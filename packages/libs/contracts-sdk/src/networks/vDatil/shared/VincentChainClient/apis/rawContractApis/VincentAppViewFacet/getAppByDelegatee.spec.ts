import { getTestContext } from '../testContext';
import { getAppByDelegatee } from './getAppByDelegatee';

describe('getAppByDelegatee', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });
  });

  it('should fetch app details by delegatee address', async () => {
    const { appId } = testContext.registerAppRes;

    // Now test getAppByDelegatee
    const result = await getAppByDelegatee(
      {
        delegatee: testContext.DELEGATEES[0],
      },
      testContext.networkContext,
    );

    console.log('Result:', result);

    // Verify app details
    expect(result.id).toBe(appId);
    expect(result.name).toBe(testContext.APP_NAME);
    expect(result.description).toBe(testContext.APP_DESCRIPTION);
    expect(result.manager).toBeDefined();
    expect(result.authorizedRedirectUris).toEqual(testContext.AUTHORIZED_REDIRECT_URIS);
    expect(result.delegatees).toContain(testContext.DELEGATEES[0]);
    expect(Number(result.latestVersion)).toBe(1);
  });

  it('should handle non-existent delegatee', async () => {
    const nonExistentAddress = testContext.failCase.nonExistentAddress;

    await expect(
      getAppByDelegatee(
        {
          delegatee: nonExistentAddress,
        },
        testContext.networkContext,
      ),
    ).rejects.toThrow();
  });
});
