const VALID_TEST_STATES = new Set(['fresh', 'new_pkp', 'reuse']);

/**
 * Parse test flags from env.
 * - REFUND_TEST_FUNDS=1 pnpm exec dotenvx run ... (refunds leftover Base Sepolia funds)
 * - TEST_STATE=fresh|new_pkp|reuse pnpm exec dotenvx run ... (required)
 *   - fresh: clear app/version + delegatee association and reset PKP
 *   - new_pkp: reset PKP only
 *   - reuse: reuse existing app if present (default)
 */
export const getTestFlags = () => {
  const refundEnv = (process.env.REFUND_TEST_FUNDS || 'true').toLowerCase();
  const testStateEnv = (process.env.TEST_STATE || '').toLowerCase();

  if (!testStateEnv) {
    throw new Error(
      [
        '❌ Missing TEST_STATE env var. Set TEST_STATE=fresh|new_pkp|reuse.',
        '- fresh = reset PKP + clear app/version + remove delegatee',
        '- new_pkp = reset PKP only',
        '- reuse = reuse existing app if present',
      ].join('\n'),
    );
  }
  if (!VALID_TEST_STATES.has(testStateEnv)) {
    throw new Error(`Invalid TEST_STATE "${testStateEnv}". Expected fresh|new_pkp|reuse.`);
  }

  const resolvedState = testStateEnv as 'fresh' | 'new_pkp' | 'reuse';

  return {
    shouldRefund: ['1', 'true', 'yes'].includes(refundEnv),
    shouldResetPkp: resolvedState === 'fresh' || resolvedState === 'new_pkp',
    shouldFreshState: resolvedState === 'fresh',
    testState: resolvedState,
  };
};
