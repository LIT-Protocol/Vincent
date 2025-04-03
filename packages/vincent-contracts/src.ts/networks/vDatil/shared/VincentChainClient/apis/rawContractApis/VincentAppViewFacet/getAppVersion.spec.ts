import { getTestContext } from '../testContext';
import { getAppVersion } from './getAppVersion';

describe('getAppVersion', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });
  });

  it('should fetch app version details', async () => {
    const { appId } = testContext.registerAppRes;

    // Now test getAppVersion
    const result = await getAppVersion(
      {
        appId,
        version: 1, // First version
      },
      testContext.networkContext,
    );

    // Verify the response structure
    expect(result[0]).toBeDefined(); // app details
    expect(result[1]).toBeDefined(); // version details

    // Verify app details
    expect(result[0].id).toBe(appId);
    expect(result[0].name).toBe(testContext.APP_NAME);
    expect(result[0].description).toBe(testContext.APP_DESCRIPTION);
    expect(result[0].manager).toBeDefined();
    expect(result[0].authorizedRedirectUris).toEqual(
      testContext.AUTHORIZED_REDIRECT_URIS,
    );
    expect(result[0].delegatees).toContain(testContext.DELEGATEES[0]);

    // Verify version details
    expect(Number(result[1].version)).toBe(1);
    expect(result[1].enabled).toBeDefined();
    expect(Array.isArray(result[1].delegatedAgentPkpTokenIds)).toBe(true);
    expect(Array.isArray(result[1].tools)).toBe(true);
    expect(result[1].tools[0].toolIpfsCid).toBe(testContext.TOOL_IPFS_CIDS[0]);
  });

  it('should handle non-existent app version', async () => {
    await expect(
      getAppVersion(
        {
          appId: testContext.failCase.nonExistentAppId,
          version: 1,
        },
        testContext.networkContext,
      ),
    ).rejects.toThrow();
  });
});
