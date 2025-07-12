import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { getTestContext } from '../testContext';
import { updateApprovedLitActionsManager } from './updateApprovedLitActionsManager';

describe('updateApprovedLitActionsManager', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  // Generate a random wallet address as the new manager
  const newManagerAddress = privateKeyToAccount(generatePrivateKey()).address;

  beforeAll(async () => {
    testContext = await getTestContext();
  });

  it('should update the approved tools manager on the Vincent network', async () => {
    const res = await updateApprovedLitActionsManager(
      {
        newManager: newManagerAddress,
      },
      testContext.networkContext,
    );

    console.log(res);

    expect(res.hash).toBeDefined();
    expect(res.receipt).toBeDefined();
    expect(res.decodedLogs).toBeDefined();

    // Find the ApprovedLitActionsManagerUpdated event
    const event = res.decodedLogs.find(
      (log) =>
        log.eventName === 'ApprovedLitActionsManagerUpdated' && log.args.newManager !== undefined,
    );
    expect(event).toBeDefined();
    expect(event?.args.newManager.toLowerCase()).toEqual(newManagerAddress.toLowerCase());
  });
});
