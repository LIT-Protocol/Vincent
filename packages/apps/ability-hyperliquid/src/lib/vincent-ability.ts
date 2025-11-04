import {
  createVincentAbility,
  ERC20_ABI,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { ethers } from 'ethers';
import * as hyperliquid from '@nktkas/hyperliquid';

import { HYPERLIQUID_BRIDGE_ADDRESS, ARBITRUM_USDC_ADDRESS } from './types';
import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  abilityParamsSchema,
} from './schemas';
import { sendDepositTx, transferToSpot } from './ability-helpers';
import { depositPrechecks } from './ability-checks';

export const bigintReplacer = (key: string, value: unknown) => {
  return typeof value === 'bigint' ? value.toString() : value;
};

export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/vincent-ability-hyperliquid' as const,
  abilityDescription: 'Ability to interact with the Hyperliquid API' as const,
  abilityParamsSchema,
  supportedPolicies: supportedPoliciesForAbility([]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    console.log(
      '[@lit-protocol/vincent-ability-hyperliquid precheck]',
      JSON.stringify(abilityParams, bigintReplacer, 2),
    );

    const { action, arbitrumRpcUrl } = abilityParams;

    const transport = new hyperliquid.HttpTransport();
    const infoClient = new hyperliquid.InfoClient({ transport });

    let hyperLiquidAccountAlreadyExists = false;
    try {
      await infoClient.clearinghouseState({ user: delegatorPkpInfo.ethAddress });
      hyperLiquidAccountAlreadyExists = true;
    } catch (error) {
      console.error(
        '[@lit-protocol/vincent-ability-hyperliquid precheck] Error checking clearinghouse state',
        error,
      );

      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('does not exist')) {
        hyperLiquidAccountAlreadyExists = false;
      }

      // Unknown error occurred
      throw error;
    }

    switch (action) {
      case 'deposit': {
        if (hyperLiquidAccountAlreadyExists) {
          return succeed({
            action,
            hyperLiquidAccountAlreadyExists: true,
          });
        }

        if (!arbitrumRpcUrl) {
          return fail({ action, reason: 'Arbitrum RPC URL is required for precheck' });
        }

        if (!abilityParams.deposit) {
          return fail({ action, reason: 'Deposit parameters are required for precheck' });
        }

        const result = await depositPrechecks({
          provider: new ethers.providers.StaticJsonRpcProvider(arbitrumRpcUrl),
          agentWalletPkpEthAddress: delegatorPkpInfo.ethAddress,
          depositAmount: abilityParams.deposit.amount,
        });

        if (!result.success) {
          return fail({ action, reason: result.reason, usdcBalance: result.balance });
        }

        return succeed({
          action,
          hyperLiquidAccountAlreadyExists: false,
        });
      }

      case 'transferToSpot': {
        if (!hyperLiquidAccountAlreadyExists) {
          return fail({
            action,
            reason: 'Hyperliquid account does not exist. Please deposit first.',
          });
        }

        if (!abilityParams.transferToSpot) {
          return fail({ action, reason: 'Transfer to spot parameters are required for precheck' });
        }

        // Check if account has sufficient funds
        try {
          const clearinghouseState = await infoClient.clearinghouseState({
            user: delegatorPkpInfo.ethAddress,
          });

          const availableUsdcBalance = ethers.utils.parseUnits(
            clearinghouseState.marginSummary.accountValue,
            6, // USDC has 6 decimals
          );

          if (availableUsdcBalance.lt(ethers.BigNumber.from(abilityParams.transferToSpot.amount))) {
            return fail({
              action,
              reason: `Insufficient balance. Available: ${availableUsdcBalance} USDC, Requested: ${abilityParams.transferToSpot.amount} USDC`,
              availableUsdcBalance: availableUsdcBalance.toString(),
            });
          }

          return succeed({
            action,
            availableUsdcBalance: availableUsdcBalance.toString(),
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return fail({ action, reason: `Error checking balance: ${errorMessage}` });
        }
      }
    }

    return fail({ action, reason: `Unknown action: ${action}` });
  },

  execute: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    console.log(
      '[@lit-protocol/vincent-ability-hyperliquid execute]',
      JSON.stringify(abilityParams, bigintReplacer, 2),
    );

    const { action } = abilityParams;

    const transport = new hyperliquid.HttpTransport();

    try {
      switch (action) {
        case 'deposit': {
          if (!abilityParams.deposit) {
            return fail({ action, reason: 'Deposit parameters are required' });
          }

          // Get Arbitrum RPC URL
          const rpcUrl = await Lit.Actions.getRpcUrl({ chain: 'arbitrum' });

          // Encode ERC20 transfer function call data
          const iface = new ethers.utils.Interface(ERC20_ABI);
          const calldata = iface.encodeFunctionData('transfer', [
            HYPERLIQUID_BRIDGE_ADDRESS,
            abilityParams.deposit.amount,
          ]);

          // Send deposit transaction using helper
          const txHash = await sendDepositTx({
            rpcUrl,
            chainId: 42161, // Arbitrum mainnet
            pkpEthAddress: delegatorPkpInfo.ethAddress,
            pkpPublicKey: delegatorPkpInfo.publicKey,
            to: ARBITRUM_USDC_ADDRESS,
            value: '0x0',
            calldata,
          });

          return succeed({
            action,
            txHash,
          });
        }

        case 'transferToSpot': {
          if (!abilityParams.transferToSpot) {
            return fail({ action, reason: 'Transfer to spot parameters are required' });
          }

          const result = await transferToSpot({
            transport,
            pkpPublicKey: delegatorPkpInfo.publicKey,
            amount: abilityParams.transferToSpot.amount,
          });

          if (result.transferResult.status === 'err') {
            return fail({
              action,
              reason: result.transferResult.response as string,
            });
          }

          if (result.transferResult.status === 'ok') {
            return succeed({ action });
          } else {
            // Unknown response
            return fail({
              action,
              reason: `Unknown response: ${JSON.stringify(result.transferResult, null, 2)}`,
            });
          }
        }

        default:
          return fail({ action, reason: `Unknown action: ${action}` });
      }
    } catch (error) {
      console.error('[@lit-protocol/vincent-ability-hyperliquid execute] Error', error);
      return fail({
        action,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  },
});
