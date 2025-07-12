import { getTestContext } from '../testContext';
import { approveLitActions } from './approveLitActions';

describe('approveLitActions', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  // Register the tool with a single-item array
  const randomIpfsCids = [`Qm${Math.random().toString(36).substring(2, 15)}`];

  beforeAll(async () => {
    testContext = await getTestContext();
  });

  it('should approve tools for use on the Vincent network', async () => {
    // Call the approveLitActions function with the original array structure
    const res = await approveLitActions(
      {
        litActionIpfsCids: randomIpfsCids,
      },
      testContext.networkContext,
    );

    console.log(res);

    expect(res.hash).toBeDefined();
    expect(res.receipt).toBeDefined();
    expect(res.decodedLogs).toBeDefined();

    // Find the LitActionApproved event for each tool
    const event = res.decodedLogs.find(
      (log) => log.eventName === 'LitActionApproved' && log.args.litActionIpfsCidHash !== undefined,
    );
    expect(event).toBeDefined();
  });
});
