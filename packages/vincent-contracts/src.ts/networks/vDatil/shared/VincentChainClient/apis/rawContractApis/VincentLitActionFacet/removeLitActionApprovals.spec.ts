import { getTestContext } from '../testContext';
import { approveLitActions } from './approveLitActions';
import { removeLitActionApprovals } from './removeLitActionApprovals';

describe('removeToolApprovals', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  // Register the tool with a single-item array
  const randomIpfsCids = [`Qm${Math.random().toString(36).substring(2, 15)}`];

  beforeAll(async () => {
    testContext = await getTestContext();

    // Approve the tool
    await approveLitActions(
      {
        litActionIpfsCids: randomIpfsCids,
      },
      testContext.networkContext,
    );
  });

  it('should remove approvals for tools on the Vincent network', async () => {
    const res = await removeLitActionApprovals(
      {
        litActionIpfsCids: randomIpfsCids,
      },
      testContext.networkContext,
    );
    console.log(res);
    expect(res.hash).toBeDefined();
    expect(res.receipt).toBeDefined();
    expect(res.decodedLogs).toBeDefined();

    // Find the LitActionApprovalRemoved event for each tool
    for (const _ of randomIpfsCids) {
      const event = res.decodedLogs.find(
        (log) =>
          log.eventName === 'LitActionApprovalRemoved' &&
          log.args.litActionIpfsCidHash !== undefined,
      );
      expect(event).toBeDefined();
    }
  });
});
