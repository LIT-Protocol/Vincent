import { getTestContext } from '../testContext';
import { getAllApprovedLitActions } from './getAllApprovedLitActions';

describe('getAllApprovedLitActions', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext();
  });

  it('should retrieve all approved tools from the Vincent network', async () => {
    const result = await getAllApprovedLitActions(testContext.networkContext);

    // Log the result for debugging
    console.log(JSON.stringify(result, null, 2));

    // Verify structure of the response
    expect(result).toHaveProperty('litActionIpfsCids');

    // Verify that litActionIpfsCids is an array
    expect(Array.isArray(result.litActionIpfsCids)).toBe(true);

    // Since we're using a mocked context in tests, we can't verify exact content,
    // but we can verify the structure is correct
  });
});
