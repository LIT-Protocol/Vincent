import { getTestContext } from '../testContext';
import { permitAppVersion } from '../VincentUserFacet/permitAppVersion';
import { getAppVersion } from '../VincentAppViewFacet/getAppVersion';
import { validateToolExecutionAndGetPolicies } from './validateToolExecutionAndGetPolicies';

// Helper function to safely stringify objects with BigInt values
const bigIntSafeStringify = (obj: any) => {
  return JSON.stringify(obj, (_, value) => (typeof value === 'bigint' ? value.toString() : value));
};

describe('validateToolExecutionAndGetPolicies', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });

    // Get the app version details first
    const appVersionRes = await getAppVersion(
      {
        appId: testContext.registerAppRes.appId,
        version: 1n, // First version
      },
      testContext.networkContext,
    );

    // Permit the app version to set up the test data
    await permitAppVersion(
      {
        pkpTokenId: testContext.AGENT_PKP_TOKEN_IDS[0],
        appId: testContext.registerAppRes.appId,
        appVersion: appVersionRes[1].version,
        toolIpfsCids: testContext.TOOL_IPFS_CIDS,
        policyIpfsCids: testContext.TOOL_POLICIES,
        policyParameterNames: testContext.TOOL_POLICY_PARAMETER_NAMES,
        policyParameterValues: testContext.TOOL_POLICY_PARAMETER_VALUES,
      },
      testContext.networkContext,
    );
  });

  it('should validate tool execution and return policies for a permitted tool', async () => {
    // The delegatee should be the one set up in the registered app
    const delegatee = testContext.DELEGATEES[0];

    const result = await validateToolExecutionAndGetPolicies(
      {
        delegatee: delegatee,
        pkpTokenId: testContext.AGENT_PKP_TOKEN_IDS[0],
        toolIpfsCid: testContext.TOOL_IPFS_CIDS[0],
      },
      testContext.networkContext,
    );

    // Log the result for debugging
    console.log('Validation result:', bigIntSafeStringify(result));

    // Verify the structure of the response
    expect(result).toHaveProperty('isPermitted');
    expect(result).toHaveProperty('appId');
    expect(result).toHaveProperty('appVersion');
    expect(result).toHaveProperty('policies');

    // Since we permitted the app version with this tool, execution should be permitted
    expect(result.isPermitted).toBe(true);

    // The app ID should match what we set up
    expect(result.appId).toBe(testContext.registerAppRes.appId);

    // Should have at least one policy
    expect(result.policies.length).toBeGreaterThan(0);

    // Verify policy structure
    if (result.policies.length > 0) {
      const policy = result.policies[0];
      expect(policy).toHaveProperty('policyIpfsCid');
      expect(policy).toHaveProperty('parameters');

      // The policy IPFS CID should match what we permitted
      expect(policy.policyIpfsCid).toBe(testContext.TOOL_POLICIES[0][0]);
    }
  });

  it('should return isPermitted=false for a non-permitted tool', async () => {
    // The delegatee should be the one set up in the registered app
    const delegatee = testContext.DELEGATEES[0];

    // Use a random tool IPFS CID that wasn't permitted
    const nonPermittedToolIpfsCid = `QmNonPermitted${Date.now()}`;

    const result = await validateToolExecutionAndGetPolicies(
      {
        delegatee: delegatee,
        pkpTokenId: testContext.AGENT_PKP_TOKEN_IDS[0],
        toolIpfsCid: nonPermittedToolIpfsCid,
      },
      testContext.networkContext,
    );

    // Log the result for debugging
    console.log('Validation result for non-permitted tool:', bigIntSafeStringify(result));

    // Verify structure
    expect(result).toHaveProperty('isPermitted');

    // The tool execution should not be permitted
    expect(result.isPermitted).toBe(false);
  });

  it('should fail for an unauthorized delegatee', async () => {
    // Use a different delegatee that wasn't authorized for the app
    const unauthorizedDelegatee = '0x1234567890123456789012345678901234567890';

    // We expect this to throw a specific error
    await expect(
      validateToolExecutionAndGetPolicies(
        {
          delegatee: unauthorizedDelegatee,
          pkpTokenId: testContext.AGENT_PKP_TOKEN_IDS[0],
          toolIpfsCid: testContext.TOOL_IPFS_CIDS[0],
        },
        testContext.networkContext,
      ),
    ).rejects.toThrow('DelegateeNotAssociatedWithApp');
  });
});
