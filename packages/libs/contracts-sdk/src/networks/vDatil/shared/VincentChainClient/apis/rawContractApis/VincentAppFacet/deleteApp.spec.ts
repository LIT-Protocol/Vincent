import { deleteApp } from './deleteApp';
import { getTestContext } from '../testContext';

describe('deleteApp', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });
  });

  it('should delete an existing app', async () => {
    const { appId } = testContext.registerAppRes;

    const res = await deleteApp(
      {
        appId: appId,
      },
      testContext.networkContext,
    );

    console.log(res);

    expect(res.hash).toBeDefined();
    expect(res.receipt).toBeDefined();
    expect(res.decodedLogs).toBeDefined();

    // Find the AppDeleted event
    const event = res.decodedLogs.find((log) => log.eventName === 'AppDeleted');
    expect(event).toBeDefined();
    expect(event?.args.appId).toEqual(appId);

    // Verify the app is marked as deleted
    // Note: Depending on your implementation, you might need to call getAppById
    // to verify the isDeleted flag is set to true
  });
});
