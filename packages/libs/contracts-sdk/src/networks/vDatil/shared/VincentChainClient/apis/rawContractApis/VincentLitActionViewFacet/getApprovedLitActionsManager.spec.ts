import { getTestContext } from '../testContext';
import { getApprovedLitActionsManager } from './getApprovedLitActionsManager';

describe('getApprovedLitActionsManager', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext();
  });

  it('should retrieve the approved tools manager address from the Vincent network', async () => {
    const result = await getApprovedLitActionsManager(testContext.networkContext);

    // Log the result for debugging
    console.log(JSON.stringify(result, null, 2));

    // Verify structure of the response
    expect(result).toHaveProperty('manager');

    // Verify that manager is a valid Ethereum address (starts with 0x followed by 40 hex chars)
    expect(typeof result.manager).toBe('string');
    expect(result.manager).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
});
