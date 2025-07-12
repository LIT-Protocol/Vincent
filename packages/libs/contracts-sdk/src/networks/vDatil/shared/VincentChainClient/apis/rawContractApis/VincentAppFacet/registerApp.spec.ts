import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { getTestContext } from '../testContext';
import { registerApp } from './registerApp';

describe('registerApp', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeEach(async () => {
    testContext = await getTestContext();
  });

  it('should register a new app with test parameters', async () => {
    const res = await registerApp(
      {
        appName: testContext.APP_NAME,
        appDescription: testContext.APP_DESCRIPTION,
        deploymentStatus: 0,
        authorizedRedirectUris: testContext.AUTHORIZED_REDIRECT_URIS,
        delegatees: testContext.DELEGATEES,
        toolIpfsCids: testContext.TOOL_IPFS_CIDS,
        toolPolicies: testContext.TOOL_POLICIES,
        toolPolicyParameterNames: testContext.TOOL_POLICY_PARAMETER_NAMES,
        toolPolicyParameterTypes: testContext.TOOL_POLICY_PARAMETER_TYPES,
      },
      testContext.networkContext,
    );

    console.log(res);

    expect(res.hash).toBeDefined();
    expect(res.receipt).toBeDefined();
    expect(res.decodedLogs).toBeDefined();

    // check events
    const eventAuthorizedRedirectUriAdded = res.decodedLogs.find(
      (log) => log.eventName === 'AuthorizedRedirectUriAdded',
    );

    const appId = res.decodedLogs.find(
      (log) =>
        log.eventName === 'AuthorizedRedirectUriAdded' ||
        log.eventName === 'NewAppRegistered' ||
        log.eventName === 'NewAppVersionRegistered',
    )?.args.appId;

    console.log('res.decodedLogs:', res.decodedLogs);

    console.log('App ID: ', appId);
  });
});
