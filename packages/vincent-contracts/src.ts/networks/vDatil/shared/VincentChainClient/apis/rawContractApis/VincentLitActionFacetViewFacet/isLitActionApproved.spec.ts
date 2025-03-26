import { getTestContext } from '../testContext';
import { isLitActionApproved } from './isLitActionApproved';
import { approveLitActions } from '../VincentLitActionFacet/approveLitActions';
import { removeLitActionApprovals } from '../VincentLitActionFacet/removeLitActionApprovals';

describe('isLitActionApproved', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  const randomIpfsCid = [
    `Qm${Math.random().toString(36).substring(2, 15)}`,
    `Qm${Math.random().toString(36).substring(2, 15)}`,
  ];

  beforeAll(async () => {
    testContext = await getTestContext();

    // Approve both lit actions
    await approveLitActions(
      {
        litActionIpfsCids: randomIpfsCid,
      },
      testContext.networkContext,
    );
  });

  it('should check if a lit action is approved on the Vincent network', async () => {
    const result = await isLitActionApproved(
      {
        litActionIpfsCid: randomIpfsCid[0],
      },
      testContext.networkContext,
    );

    // Log the result for debugging
    console.log(JSON.stringify(result, null, 2));

    // Verify structure of the response
    expect(result).toHaveProperty('isApproved');

    // Now that we've approved the tool, we expect isApproved to be true
    expect(result.isApproved).toBe(true);
  });

  it('should return false for a non-approved lit action', async () => {
    // Create a random IPFS CID that hasn't been approved
    const nonApprovedCid = `QmRandom${Math.random().toString(36).substring(2, 10)}`;

    const result = await isLitActionApproved(
      {
        litActionIpfsCid: nonApprovedCid,
      },
      testContext.networkContext,
    );

    // Verify the result is false since this lit action hasn't been approved
    expect(result.isApproved).toBe(false);
  });

  it('should return false after a lit action approval is removed', async () => {
    // First, verify the lit action is currently approved
    const initialResult = await isLitActionApproved(
      {
        litActionIpfsCid: randomIpfsCid[0],
      },
      testContext.networkContext,
    );

    expect(initialResult.isApproved).toBe(true);

    // Now remove approval for the lit action
    await removeLitActionApprovals(
      {
        litActionIpfsCids: [randomIpfsCid[0]],
      },
      testContext.networkContext,
    );

    // Check again - should now be false
    const afterResult = await isLitActionApproved(
      {
        litActionIpfsCid: randomIpfsCid[0],
      },
      testContext.networkContext,
    );

    expect(afterResult.isApproved).toBe(false);
  });
});
