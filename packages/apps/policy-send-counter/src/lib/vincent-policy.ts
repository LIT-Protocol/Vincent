import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';
import { laUtils } from '@lit-protocol/vincent-scaffold-sdk';

import { checkSendLimit, resetSendCounter } from './helpers/index';
import {
  commitAllowResultSchema,
  commitDenyResultSchema,
  commitParamsSchema,
  evalAllowResultSchema,
  evalDenyResultSchema,
  precheckAllowResultSchema,
  precheckDenyResultSchema,
  abilityParamsSchema,
  userParamsSchema,
} from './schemas';
import { counterSignatures } from './abi/counterSignatures';

export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/vincent-policy-send-counter-limit' as const,

  abilityParamsSchema,
  userParamsSchema,
  commitParamsSchema,

  precheckAllowResultSchema,
  precheckDenyResultSchema,

  evalAllowResultSchema,
  evalDenyResultSchema,

  commitAllowResultSchema,
  commitDenyResultSchema,

  precheck: async (
    { abilityParams, userParams },
    { allow, deny, appId, delegation: { delegatorPkpInfo } },
  ) => {
    console.log(
      '[@lit-protocol/vincent-policy-send-counter-limit/precheck] 🔍 POLICY PRECHECK CALLED',
    );
    console.log(
      '[@lit-protocol/vincent-policy-send-counter-limit/precheck] 🔍 Policy precheck params:',
      {
        abilityParams,
        userParams,
        ethAddress: delegatorPkpInfo.ethAddress,
        appId,
      },
    );

    // Only use what we actually need - no defaults in policy logic
    const { maxSends, timeWindowSeconds } = userParams;
    const { ethAddress } = delegatorPkpInfo;

    try {
      // Check current send limit for the user
      const limitCheck = await checkSendLimit(ethAddress, maxSends, timeWindowSeconds);

      if (!limitCheck.allowed) {
        const denyResult = {
          reason: `Send limit exceeded. Maximum ${maxSends} sends per ${timeWindowSeconds} seconds. Try again in ${
            limitCheck.secondsUntilReset
          } seconds.`,
          currentCount: limitCheck.currentCount,
          maxSends: maxSends,
          secondsUntilReset: limitCheck.secondsUntilReset || 0,
        };

        console.log(
          '[@lit-protocol/vincent-policy-send-counter-limit/precheck] 🚫 POLICY PRECHECK DENYING REQUEST:',
        );
        console.log(
          '[@lit-protocol/vincent-policy-send-counter-limit/precheck] 🚫 Deny result:',
          JSON.stringify(denyResult, null, 2),
        );
        console.log(
          '[@lit-protocol/vincent-policy-send-counter-limit/precheck] 🚫 Current count:',
          limitCheck.currentCount,
        );
        console.log(
          '[@lit-protocol/vincent-policy-send-counter-limit/precheck] 🚫 Max sends:',
          maxSends,
        );
        console.log(
          '[@lit-protocol/vincent-policy-send-counter-limit/precheck] 🚫 Limit check result:',
          JSON.stringify(limitCheck, null, 2),
        );
        console.log(
          '[@lit-protocol/vincent-policy-send-counter-limit/precheck] 🚫 About to call deny() function...',
        );

        const denyResponse = deny(denyResult);
        console.log(
          '[@lit-protocol/vincent-policy-send-counter-limit/precheck] 🚫 POLICY PRECHECK DENY RESPONSE:',
          JSON.stringify(denyResponse, null, 2),
        );
        return denyResponse;
      }

      const allowResult = {
        maxSends,
        timeWindowSeconds,
        currentCount: limitCheck.currentCount,
        remainingSends: limitCheck.remainingSends,
      };

      console.log('[SendLimitPolicy/precheck] ✅ POLICY PRECHECK ALLOWING REQUEST:');
      console.log(
        '[SendLimitPolicy/precheck] ✅ Allow result:',
        JSON.stringify(allowResult, null, 2),
      );
      console.log('[SendLimitPolicy/precheck] ✅ Current count:', limitCheck.currentCount);
      console.log('[SendLimitPolicy/precheck] ✅ Max sends:', maxSends);
      console.log('[SendLimitPolicy/precheck] ✅ Remaining sends:', limitCheck.remainingSends);

      const allowResponse = allow(allowResult);
      console.log(
        '[SendLimitPolicy/precheck] ✅ POLICY PRECHECK ALLOW RESPONSE:',
        JSON.stringify(allowResponse, null, 2),
      );
      return allowResponse;
    } catch (error) {
      console.error('[SendLimitPolicy/precheck] Error in precheck:', error);
      return deny({
        maxSends,
        reason: `Policy error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        currentCount: 0,
        secondsUntilReset: 0,
      });
    }
  },

  evaluate: async (
    { abilityParams, userParams },
    { allow, deny, delegation: { delegatorPkpInfo } },
  ) => {
    console.log(
      '[@lit-protocol/vincent-policy-send-counter-limit/evaluate] Evaluating send limit policy',
      {
        abilityParams,
        userParams,
      },
    );

    // Only use what we actually need - no defaults in policy logic
    const { maxSends, timeWindowSeconds } = userParams;
    const { ethAddress } = delegatorPkpInfo;

    const checkSendResponse = await Lit.Actions.runOnce(
      { waitForResponse: true, name: 'checkSendLimit' },
      async () => {
        try {
          const limitCheck = await checkSendLimit(ethAddress, maxSends, timeWindowSeconds);

          return JSON.stringify({
            status: 'success',
            ...limitCheck,
          });
        } catch (error) {
          return JSON.stringify({
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
    );

    const parsedResponse = JSON.parse(checkSendResponse);
    if (parsedResponse.status === 'error') {
      return deny({
        maxSends,
        timeWindowSeconds,
        reason: `Error checking send limit: ${parsedResponse.error} (evaluate)`,
        currentCount: 0,
        secondsUntilReset: 0,
      });
    }

    const { allowed, currentCount, remainingSends, secondsUntilReset } = parsedResponse;

    if (!allowed) {
      return deny({
        reason: `Send limit exceeded during evaluation. Maximum ${maxSends} sends per ${timeWindowSeconds} seconds. Try again in ${secondsUntilReset} seconds.`,
        currentCount,
        maxSends,
        timeWindowSeconds,
        secondsUntilReset: secondsUntilReset || 0,
      });
    }

    console.log(
      '[@lit-protocol/vincent-policy-send-counter-limit/evaluate] Evaluated send limit policy',
      {
        currentCount,
        maxSends,
        remainingSends,
      },
    );

    return allow({
      currentCount,
      maxSends,
      remainingSends,
      timeWindowSeconds,
    });
  },

  commit: async (
    { currentCount, maxSends, timeWindowSeconds },
    { allow, appId, delegation: { delegatorPkpInfo } },
  ) => {
    const { ethAddress } = delegatorPkpInfo;

    console.log('[@lit-protocol/vincent-policy-send-counter-limit/commit] 🚀 IM COMMITING!');

    // Check if we need to reset the counter first
    const checkResponse = await checkSendLimit(ethAddress, maxSends, timeWindowSeconds);

    if (checkResponse.shouldReset) {
      console.log(
        `[@lit-protocol/vincent-policy-send-counter-limit/commit] Resetting counter for ${ethAddress} due to time window expiration`,
      );
      try {
        await resetSendCounter(ethAddress, delegatorPkpInfo.publicKey);
        console.log(
          `[@lit-protocol/vincent-policy-send-counter-limit/commit] Counter reset successful for ${ethAddress}`,
        );
      } catch (error) {
        console.warn(`Counter reset failed for ${ethAddress}:`, error);
        // Continue anyway, the counter will still work
      }
    }

    try {
      // Record the send to the smart contract
      console.log(
        `[@lit-protocol/vincent-policy-send-counter-limit/commit] Recording send to contract for ${ethAddress} (appId: ${appId})`,
      );

      // Execute the contract call to increment the counter directly
      console.log(
        `[@lit-protocol/vincent-policy-send-counter-limit/commit] Calling incrementByAddress(${ethAddress}) on contract ${counterSignatures.address}`,
      );

      // Call contract directly without Lit.Actions.runOnce wrapper
      const txHash = await laUtils.transaction.handler.contractCall({
        provider: new ethers.providers.JsonRpcProvider(
          await Lit.Actions.getRpcUrl({ chain: 'yellowstone' }),
        ),
        pkpPublicKey: delegatorPkpInfo.publicKey,
        callerAddress: ethAddress,
        abi: [counterSignatures.methods.increment],
        contractAddress: counterSignatures.address,
        functionName: 'increment',
        args: [],
      });

      const newCount = currentCount + 1;
      const remainingSends = maxSends - newCount;

      console.log(
        '[@lit-protocol/vincent-policy-send-counter-limit/commit] Policy commit successful',
        {
          ethAddress,
          newCount,
          maxSends,
          remainingSends,
          txHash,
        },
      );

      return allow({
        recorded: true,
        newCount,
        remainingSends: Math.max(0, remainingSends),
      });
    } catch (error) {
      console.error(
        '[@lit-protocol/vincent-policy-send-counter-limit/commit] Error in commit phase:',
        error,
      );
      // Still return success since the transaction itself succeeded
      return allow({
        recorded: false,
        newCount: currentCount + 1,
        remainingSends: Math.max(0, maxSends - currentCount - 1),
      });
    }
  },
});
