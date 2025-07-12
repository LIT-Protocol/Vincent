import { addAuthorizedRedirectUri } from './addAuthorizedRedirectUri';
import { vincentNetworkContext } from '../../../NetworkContextManager';
import { getTestContext } from '../testContext';

describe('addAuthorizedRedirectUri', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });
  });

  it('should add an authorized redirect URI to an existing app', async () => {
    const { appId } = testContext.registerAppRes;
    const newRedirectUri = 'https://example.com/callback';

    const res = await addAuthorizedRedirectUri(
      {
        appId: appId,
        redirectUri: newRedirectUri,
      },
      vincentNetworkContext,
    );

    console.log(res);

    expect(res.hash).toBeDefined();
    expect(res.receipt).toBeDefined();
    expect(res.decodedLogs).toBeDefined();

    // Find the AuthorizedRedirectUriAdded event
    const event = res.decodedLogs.find((log) => log.eventName === 'AuthorizedRedirectUriAdded');
    expect(event).toBeDefined();
    expect(event?.args.appId).toEqual(appId);
    // Note: The actual redirectUri isn't returned in the event, only its hash
  });
});
