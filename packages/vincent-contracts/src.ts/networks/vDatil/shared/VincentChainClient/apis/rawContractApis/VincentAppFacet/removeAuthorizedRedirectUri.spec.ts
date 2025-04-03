import { removeAuthorizedRedirectUri } from './removeAuthorizedRedirectUri';
import { addAuthorizedRedirectUri } from './addAuthorizedRedirectUri';
import { getTestContext } from '../testContext';

describe('removeAuthorizedRedirectUri', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;
  let redirectUriToRemove: string;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });

    // Add a redirect URI that we can remove in the test
    redirectUriToRemove = 'https://example.com/removable-callback';

    // First add the redirect URI
    await addAuthorizedRedirectUri(
      {
        appId: testContext.registerAppRes.appId,
        redirectUri: redirectUriToRemove,
      },
      testContext.networkContext,
    );
  });

  it('should remove an authorized redirect URI from an existing app', async () => {
    const { appId } = testContext.registerAppRes;

    const res = await removeAuthorizedRedirectUri(
      {
        appId: appId,
        redirectUri: redirectUriToRemove,
      },
      testContext.networkContext,
    );

    console.log(res);

    expect(res.hash).toBeDefined();
    expect(res.receipt).toBeDefined();
    expect(res.decodedLogs).toBeDefined();

    // Find the AuthorizedRedirectUriRemoved event
    const event = res.decodedLogs.find(
      (log) => log.eventName === 'AuthorizedRedirectUriRemoved',
    );
    expect(event).toBeDefined();
    expect(event?.args.appId).toEqual(appId);
  });
});
