import {
  createVincentAbility,
  ERC20_ABI,
  supportedPoliciesForAbility,
  bigintReplacer,
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
import { sendDepositTx, transferUsdcTo } from './ability-helpers';
import { depositPrechecks } from './ability-checks';

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

        if (!abilityParams.transfer) {
          return fail({ action, reason: 'Transfer to spot parameters are required for precheck' });
        }

        // Check if account has sufficient funds in perp account
        try {
          const clearinghouseState = await infoClient.clearinghouseState({
            user: delegatorPkpInfo.ethAddress,
          });

          const availableUsdcBalance = ethers.utils.parseUnits(
            clearinghouseState.marginSummary.accountValue,
            6, // USDC has 6 decimals
          );

          if (availableUsdcBalance.lt(ethers.BigNumber.from(abilityParams.transfer.amount))) {
            return fail({
              action,
              reason: `Insufficient perp balance. Available: ${availableUsdcBalance} USDC, Requested: ${abilityParams.transfer.amount} USDC`,
              availableUsdcBalance: availableUsdcBalance.toString(),
            });
          }

          return succeed({
            action,
            availableUsdcBalance: availableUsdcBalance.toString(),
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return fail({ action, reason: `Error checking perp balance: ${errorMessage}` });
        }
      }

      case 'transferToPerp': {
        if (!hyperLiquidAccountAlreadyExists) {
          return fail({
            action,
            reason: 'Hyperliquid account does not exist. Please deposit first.',
          });
        }

        if (!abilityParams.transfer) {
          return fail({ action, reason: 'Transfer to perp parameters are required for precheck' });
        }

        // Check if account has sufficient funds in spot account
        try {
          const spotState = await infoClient.spotClearinghouseState({
            user: delegatorPkpInfo.ethAddress,
          });

          // Find USDC balance in spot account
          const usdcBalance = spotState.balances.find((b) => b.coin === 'USDC');

          if (!usdcBalance) {
            return fail({
              action,
              reason: 'No USDC balance found in spot account',
              availableUsdcBalance: '0',
            });
          }

          const availableUsdcBalance = ethers.utils.parseUnits(
            usdcBalance.total,
            6, // USDC has 6 decimals
          );

          if (availableUsdcBalance.lt(ethers.BigNumber.from(abilityParams.transfer.amount))) {
            return fail({
              action,
              reason: `Insufficient spot balance. Available: ${availableUsdcBalance} USDC, Requested: ${abilityParams.transfer.amount} USDC`,
              availableUsdcBalance: availableUsdcBalance.toString(),
            });
          }

          return succeed({
            action,
            availableUsdcBalance: availableUsdcBalance.toString(),
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return fail({ action, reason: `Error checking spot balance: ${errorMessage}` });
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

        case 'transferToSpot':
        case 'transferToPerp': {
          if (!abilityParams.transfer) {
            return fail({
              action,
              reason:
                'Transfer to parameters are required for transferToSpot/transferToPerp action',
            });
          }

          const result = await transferUsdcTo({
            transport,
            pkpPublicKey: delegatorPkpInfo.publicKey,
            amount: abilityParams.transfer.amount,
            to: action === 'transferToSpot' ? 'spot' : 'perp',
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
