import { updateAppDeploymentStatus } from './updateAppDeploymentStatus';
import { getTestContext } from '../testContext';

describe('updateAppDeploymentStatus', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });
  });

  it('should update the deployment status of an existing app', async () => {
    const { appId } = testContext.registerAppRes;
    const newDeploymentStatus = 'prod'; // Using string literal instead of enum

    const res = await updateAppDeploymentStatus(
      {
        appId: appId,
        deploymentStatus: newDeploymentStatus,
      },
      testContext.networkContext,
    );

    console.log(res);

    expect(res.hash).toBeDefined();
    expect(res.receipt).toBeDefined();
    expect(res.decodedLogs).toBeDefined();

    // Find the AppDeploymentStatusUpdated event
    const event = res.decodedLogs.find((log) => log.eventName === 'AppDeploymentStatusUpdated');
    expect(event).toBeDefined();
    expect(event?.args.appId).toEqual(appId);
    expect(event?.args.deploymentStatus).toEqual(2); // 2 corresponds to PROD
  });
});
