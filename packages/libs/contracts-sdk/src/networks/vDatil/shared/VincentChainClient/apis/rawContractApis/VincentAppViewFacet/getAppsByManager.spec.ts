import { getTestContext } from '../testContext';
import { getAppsByManager } from './getAppsByManager';

describe('getAppsByManager', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });
  });

  it('should fetch apps by manager', async () => {
    const { appId, managerAddress } = testContext.registerAppRes;

    // Now test getAppsByManager
    const result = await getAppsByManager(
      {
        manager: managerAddress,
      },
      testContext.networkContext,
    );

    console.log('Result:', result);

    // Verify app details
    expect(result.length).toBeGreaterThan(0);

    // Check if our app is in the results
    const appFound = result.some((appData) => Number(appData.app.id) === Number(appId));
    expect(appFound).toBe(true);

    // Check details of the app we just created
    const ourAppData = result.find((appData) => Number(appData.app.id) === Number(appId));
    if (ourAppData) {
      const { app } = ourAppData;
      expect(app.name).toBe(testContext.APP_NAME);
      expect(app.description).toBe(testContext.APP_DESCRIPTION);
      expect(app.authorizedRedirectUris).toEqual(testContext.AUTHORIZED_REDIRECT_URIS);
      expect(app.delegatees).toContain(testContext.DELEGATEES[0]);
      expect(Number(app.latestVersion)).toBe(1);
    }
  });

  it('should handle non-existent manager', async () => {
    const nonExistentAddress = testContext.failCase.nonExistentAddress;
    await expect(
      getAppsByManager(
        {
          manager: nonExistentAddress,
        },
        testContext.networkContext,
      ),
    ).rejects.toThrow('NoAppsFoundForManager');
  });
});
