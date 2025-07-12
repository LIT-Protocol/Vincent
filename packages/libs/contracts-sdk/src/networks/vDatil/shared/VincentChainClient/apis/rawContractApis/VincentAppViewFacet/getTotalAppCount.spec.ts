import { vincentNetworkContext } from '../../../NetworkContextManager';
import { getTestContext } from '../testContext';
import { getTotalAppCount } from './getTotalAppCount';

describe('getTotalAppCount', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext();
  });

  it('should fetch the total number of registered apps', async () => {
    // Test getTotalAppCount
    const result = await getTotalAppCount(vincentNetworkContext);

    console.log('🔥 [getTotalAppCount] Total apps:', result);

    // Verify that the count is at least 1 (since we registered an app in the test setup)
    expect(Number(result)).toBeGreaterThanOrEqual(1);
  });
});
