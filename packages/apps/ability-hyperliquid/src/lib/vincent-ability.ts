import {
  createVincentAbility,
  ERC20_ABI,
  supportedPoliciesForAbility,
  bigIntReplacer,
} from '@lit-protocol/vincent-ability-sdk';
import { ethers } from 'ethers';
import * as hyperliquid from '@nktkas/hyperliquid';

import {
  HYPERLIQUID_BRIDGE_ADDRESS_MAINNET,
  HYPERLIQUID_BRIDGE_ADDRESS_TESTNET,
  ARBITRUM_USDC_ADDRESS_MAINNET,
  ARBITRUM_USDC_ADDRESS_TESTNET,
} from './types';
import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  precheckSuccessSchema,
  abilityParamsSchema,
} from './schemas';
import {
  sendDepositTx,
  transferUsdcTo,
  executeSpotOrder,
  cancelSpotOrder,
  cancelAllSpotOrders,
} from './ability-helpers';
import { depositPrechecks, spotTradePrechecks } from './ability-checks';

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
      JSON.stringify(abilityParams, bigIntReplacer, 2),
    );

    const { action, arbitrumRpcUrl, useTestnet = false } = abilityParams;

    const transport = new hyperliquid.HttpTransport({ isTestnet: useTestnet });
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

      case 'spotBuy':
      case 'spotSell': {
        if (!abilityParams.spot) {
          return fail({ action, reason: 'Spot trade parameters are required for precheck' });
        }

        const checkResult = await spotTradePrechecks(
          transport,
          delegatorPkpInfo.ethAddress,
          abilityParams.spot,
        );

        if (!checkResult.success) {
          return fail({ action, reason: checkResult.reason || 'Unknown error' });
        }

        return succeed({ action });
      }

      case 'spotCancelOrder': {
        if (!hyperLiquidAccountAlreadyExists) {
          return fail({
            action,
            reason: 'Hyperliquid account does not exist. Please deposit first.',
          });
        }

        if (!abilityParams.spotCancelOrder) {
          return fail({ action, reason: 'Cancel order parameters are required for precheck' });
        }

        // Check if the order exists and is still open
        try {
          const openOrders = await infoClient.openOrders({
            user: delegatorPkpInfo.ethAddress as `0x${string}`,
          });

          const orderExists = openOrders.some(
            (order) => order.oid === abilityParams.spotCancelOrder!.orderId,
          );

          if (!orderExists) {
            return fail({
              action,
              reason: `Order ${abilityParams.spotCancelOrder.orderId} not found or already filled/cancelled`,
            });
          }

          return succeed({ action });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return fail({ action, reason: `Error checking open orders: ${errorMessage}` });
        }
      }

      case 'spotCancelAll': {
        if (!hyperLiquidAccountAlreadyExists) {
          return fail({
            action,
            reason: 'Hyperliquid account does not exist. Please deposit first.',
          });
        }

        if (!abilityParams.spotCancelAll) {
          return fail({ action, reason: 'Cancel all parameters are required for precheck' });
        }

        // Check if there are any open orders for the symbol
        try {
          const openOrders = await infoClient.openOrders({
            user: delegatorPkpInfo.ethAddress as `0x${string}`,
          });
          const ordersForSymbol = openOrders.filter(
            (order) => order.coin === abilityParams.spotCancelAll!.symbol,
          );

          if (ordersForSymbol.length === 0) {
            return fail({
              action,
              reason: `No open orders found for ${abilityParams.spotCancelAll.symbol}`,
            });
          }

          return succeed({ action });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return fail({ action, reason: `Error checking open orders: ${errorMessage}` });
        }
      }
    }

    return fail({ action, reason: `Unknown action: ${action}` });
  },

  execute: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    console.log(
      '[@lit-protocol/vincent-ability-hyperliquid execute]',
      JSON.stringify(abilityParams, bigIntReplacer, 2),
    );

    const { action, useTestnet = false } = abilityParams;

    const transport = new hyperliquid.HttpTransport({ isTestnet: useTestnet });

    try {
      switch (action) {
        case 'deposit': {
          if (!abilityParams.deposit) {
            return fail({ action, reason: 'Deposit parameters are required' });
          }

          const useTestnet = abilityParams.useTestnet ?? false;

          // Get Arbitrum RPC URL
          const rpcUrl = await Lit.Actions.getRpcUrl({ chain: 'arbitrum' });

          // Select addresses based on network
          const bridgeAddress = useTestnet
            ? HYPERLIQUID_BRIDGE_ADDRESS_TESTNET
            : HYPERLIQUID_BRIDGE_ADDRESS_MAINNET;
          const usdcAddress = useTestnet
            ? ARBITRUM_USDC_ADDRESS_TESTNET
            : ARBITRUM_USDC_ADDRESS_MAINNET;
          const chainId = useTestnet
            ? 421614 // Arbitrum Sepolia testnet
            : 42161; // Arbitrum mainnet

          // Encode ERC20 transfer function call data
          const iface = new ethers.utils.Interface(ERC20_ABI);
          const calldata = iface.encodeFunctionData('transfer', [
            bridgeAddress,
            abilityParams.deposit.amount,
          ]);

          // Send deposit transaction using helper
          const txHash = await sendDepositTx({
            rpcUrl,
            chainId,
            pkpEthAddress: delegatorPkpInfo.ethAddress,
            pkpPublicKey: delegatorPkpInfo.publicKey,
            to: usdcAddress,
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
            useTestnet: abilityParams.useTestnet ?? false,
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

        case 'spotBuy':
        case 'spotSell': {
          if (!abilityParams.spot) {
            return fail({ action, reason: 'Spot trade parameters are required' });
          }

          const result = await executeSpotOrder({
            transport,
            pkpPublicKey: delegatorPkpInfo.publicKey,
            params: {
              symbol: abilityParams.spot.symbol,
              price: abilityParams.spot.price,
              size: abilityParams.spot.size,
              isBuy: action === 'spotBuy',
              orderType: abilityParams.spot.orderType,
            },
            useTestnet,
          });

          if (result.status === 'error') {
            return fail({
              action,
              reason: result.error,
            });
          }

          return succeed({
            action,
            orderResult: result.orderResult,
          });
        }

        case 'spotCancelOrder': {
          if (!abilityParams.spotCancelOrder) {
            return fail({ action, reason: 'Cancel order parameters are required' });
          }

          const result = await cancelSpotOrder({
            transport,
            pkpPublicKey: delegatorPkpInfo.publicKey,
            params: {
              symbol: abilityParams.spotCancelOrder.symbol,
              orderId: abilityParams.spotCancelOrder.orderId,
            },
            useTestnet,
          });

          if (result.status === 'error') {
            return fail({
              action,
              reason: result.reason,
            });
          }

          return succeed({
            action,
            cancelResult: result.cancelResult,
          });
        }

        case 'spotCancelAll': {
          if (!abilityParams.spotCancelAll) {
            return fail({ action, reason: 'Cancel all parameters are required' });
          }

          const result = await cancelAllSpotOrders({
            transport,
            pkpPublicKey: delegatorPkpInfo.publicKey,
            symbol: abilityParams.spotCancelAll.symbol,
            useTestnet,
          });

          if (result.status === 'error') {
            return fail({
              action,
              reason: result.reason as string,
            });
          }

          return succeed({
            action,
            cancelResult: result.cancelResult,
          });
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
