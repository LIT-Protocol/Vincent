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
  ARBITRUM_USDC_ADDRESS_MAINNET,
  HyperliquidAction,
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
  cancelOrder,
  cancelAllOrdersForSymbol,
  executePerpOrder,
  withdrawUsdc,
  sendSpotAsset,
  sendPerpUsdc,
} from './ability-helpers';
import {
  depositPrechecks,
  spotTradePrechecks,
  perpTradePrechecks,
  hyperliquidAccountExists,
  transferPrechecks,
  cancelOrderPrechecks,
  cancelAllOrdersForSymbolPrechecks,
  withdrawPrechecks,
  sendSpotAssetPrechecks,
  sendPerpUsdcPrechecks,
} from './ability-checks';

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

    const hyperLiquidAccountExists = await hyperliquidAccountExists({
      infoClient,
      ethAddress: delegatorPkpInfo.ethAddress,
    });

    if (action === HyperliquidAction.DEPOSIT) {
      if (useTestnet) {
        return fail({
          action,
          reason:
            'Deposit is not supported on Hyperliquid testnet. Please refer to these docs for getting testnet USDC: https://hyperliquid.gitbook.io/hyperliquid-docs/onboarding/testnet-faucet',
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
        depositAmountInMicroUsdc: abilityParams.deposit.amount,
        useTestnet,
      });

      if (!result.success) {
        return fail({ action, reason: result.reason, availableBalance: result.availableBalance });
      }

      return succeed({
        action,
      });
    }

    if (!hyperLiquidAccountExists) {
      return fail({
        action,
        reason: 'Hyperliquid account does not exist. Please deposit first.',
      });
    }

    switch (action) {
      case HyperliquidAction.WITHDRAW: {
        if (!abilityParams.withdraw) {
          return fail({ action, reason: 'Withdraw parameters are required for precheck' });
        }

        const result = await withdrawPrechecks({
          infoClient,
          ethAddress: delegatorPkpInfo.ethAddress,
          params: {
            amount: abilityParams.withdraw.amount,
          },
        });

        if (!result.success) {
          return fail({
            action,
            reason: result.reason,
            availableBalance: result.availableBalance,
            requiredBalance: result.requiredBalance,
          });
        }

        return succeed({
          action,
          availableBalance: result.availableBalance,
        });
      }

      case HyperliquidAction.SEND_SPOT_ASSET: {
        if (!abilityParams.sendSpotAsset) {
          return fail({ action, reason: 'Send asset parameters are required for precheck' });
        }

        const result = await sendSpotAssetPrechecks({
          infoClient,
          ethAddress: delegatorPkpInfo.ethAddress,
          params: {
            destination: abilityParams.sendSpotAsset.destination,
            token: abilityParams.sendSpotAsset.token,
            amount: abilityParams.sendSpotAsset.amount,
          },
        });

        if (!result.success) {
          return fail({
            action,
            reason: result.reason,
            availableBalance: result.availableBalance,
            requiredBalance: result.requiredBalance,
          });
        }

        return succeed({
          action,
          availableBalance: result.availableBalance,
        });
      }

      case HyperliquidAction.SEND_PERP_USDC: {
        if (!abilityParams.sendPerpUsdc) {
          return fail({ action, reason: 'Send perp USDC parameters are required for precheck' });
        }

        const result = await sendPerpUsdcPrechecks({
          infoClient,
          ethAddress: delegatorPkpInfo.ethAddress,
          params: {
            destination: abilityParams.sendPerpUsdc.destination,
            amount: abilityParams.sendPerpUsdc.amount,
          },
        });

        if (!result.success) {
          return fail({
            action,
            reason: result.reason,
            availableBalance: result.availableBalance,
            requiredBalance: result.requiredBalance,
          });
        }

        return succeed({
          action,
          availableBalance: result.availableBalance,
        });
      }

      case HyperliquidAction.TRANSFER_TO_SPOT:
      case HyperliquidAction.TRANSFER_TO_PERP: {
        if (!abilityParams.transfer) {
          return fail({ action, reason: 'Transfer to spot parameters are required for precheck' });
        }

        const result = await transferPrechecks({
          infoClient,
          ethAddress: delegatorPkpInfo.ethAddress,
          params: {
            amount: abilityParams.transfer.amount,
            to: action === HyperliquidAction.TRANSFER_TO_SPOT ? 'spot' : 'perp',
          },
        });

        if (!result.success) {
          return fail({
            action,
            reason: result.reason,
            availableBalance: result.availableBalance,
            requiredBalance: result.requiredBalance,
          });
        }

        return succeed({
          action,
          availableBalance: result.availableBalance,
        });
      }

      case HyperliquidAction.SPOT_BUY:
      case HyperliquidAction.SPOT_SELL: {
        if (!abilityParams.spot) {
          return fail({ action, reason: 'Spot trade parameters are required for precheck' });
        }

        const checkResult = await spotTradePrechecks({
          transport,
          ethAddress: delegatorPkpInfo.ethAddress,
          params: {
            symbol: abilityParams.spot.symbol,
            price: abilityParams.spot.price,
            size: abilityParams.spot.size,
            isBuy: action === HyperliquidAction.SPOT_BUY,
          },
        });

        if (!checkResult.success) {
          return fail({
            action,
            reason: checkResult.reason,
          });
        }

        return succeed({ action });
      }

      case HyperliquidAction.PERP_LONG:
      case HyperliquidAction.PERP_SHORT: {
        if (!abilityParams.perp) {
          return fail({ action, reason: 'Perp trade parameters are required for precheck' });
        }

        const checkResult = await perpTradePrechecks({
          transport,
          ethAddress: delegatorPkpInfo.ethAddress,
          params: {
            symbol: abilityParams.perp.symbol,
          },
        });

        if (!checkResult.success) {
          return fail({ action, reason: checkResult.reason || 'Unknown error' });
        }

        return succeed({ action });
      }

      case HyperliquidAction.CANCEL_ORDER: {
        if (!abilityParams.cancelOrder) {
          return fail({ action, reason: 'Cancel order parameters are required for precheck' });
        }

        const result = await cancelOrderPrechecks({
          infoClient,
          ethAddress: delegatorPkpInfo.ethAddress,
          params: {
            orderId: abilityParams.cancelOrder.orderId,
          },
        });

        if (!result.success) {
          return fail({
            action,
            reason: result.reason,
          });
        }

        return succeed({ action });
      }

      case HyperliquidAction.CANCEL_ALL_ORDERS_FOR_SYMBOL: {
        if (!abilityParams.cancelAllOrdersForSymbol) {
          return fail({
            action,
            reason: 'Cancel all orders for symbol parameters are required for precheck',
          });
        }

        const result = await cancelAllOrdersForSymbolPrechecks({
          infoClient,
          ethAddress: delegatorPkpInfo.ethAddress,
          params: {
            symbol: abilityParams.cancelAllOrdersForSymbol.symbol,
          },
        });

        if (!result.success) {
          return fail({
            action,
            reason: result.reason,
          });
        }

        return succeed({ action });
      }

      default:
        return fail({ action, reason: `Unknown action: ${action}` });
    }
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
        case HyperliquidAction.DEPOSIT: {
          if (useTestnet) {
            return fail({
              action,
              reason:
                'Deposit is not supported on Hyperliquid testnet. Please refer to these docs for getting testnet USDC: https://hyperliquid.gitbook.io/hyperliquid-docs/onboarding/testnet-faucet',
            });
          }

          if (!abilityParams.deposit) {
            return fail({ action, reason: 'Deposit parameters are required' });
          }

          // Get Arbitrum RPC URL
          const rpcUrl = await Lit.Actions.getRpcUrl({
            chain: 'arbitrum',
          });

          // Encode ERC20 transfer function call data
          const iface = new ethers.utils.Interface(ERC20_ABI);
          const calldata = iface.encodeFunctionData('transfer', [
            HYPERLIQUID_BRIDGE_ADDRESS_MAINNET,
            abilityParams.deposit.amount,
          ]);

          // Send deposit transaction using helper
          const txHash = await sendDepositTx({
            rpcUrl,
            chainId: 42161, // Arbitrum mainnet
            pkpEthAddress: delegatorPkpInfo.ethAddress,
            pkpPublicKey: delegatorPkpInfo.publicKey,
            to: ARBITRUM_USDC_ADDRESS_MAINNET,
            value: '0x0',
            calldata,
          });

          return succeed({
            action,
            txHash,
          });
        }

        case HyperliquidAction.WITHDRAW: {
          if (!abilityParams.withdraw) {
            return fail({ action, reason: 'Withdraw parameters are required' });
          }

          const result = await withdrawUsdc({
            transport,
            pkpPublicKey: delegatorPkpInfo.publicKey,
            amount: abilityParams.withdraw.amount,
            destination: abilityParams.withdraw.destination || delegatorPkpInfo.ethAddress,
            useTestnet,
          });

          // SuccessResponse always has status "ok", errors are thrown as exceptions
          if (result.withdrawResult.status === 'ok') {
            return succeed({ action, withdrawResult: result.withdrawResult });
          }

          // This should not happen with SuccessResponse type, but handle it for safety
          return fail({
            action,
            reason: `Unexpected response status: ${JSON.stringify(result.withdrawResult, null, 2)}`,
          });
        }

        case HyperliquidAction.SEND_SPOT_ASSET: {
          if (!abilityParams.sendSpotAsset) {
            return fail({ action, reason: 'Send spot asset parameters are required' });
          }

          const result = await sendSpotAsset({
            transport,
            pkpPublicKey: delegatorPkpInfo.publicKey,
            destination: abilityParams.sendSpotAsset.destination,
            token: abilityParams.sendSpotAsset.token,
            amount: abilityParams.sendSpotAsset.amount,
            useTestnet,
          });

          // SuccessResponse always has status "ok", errors are thrown as exceptions
          if (result.sendResult.status === 'ok') {
            return succeed({ action, sendResult: result.sendResult });
          }

          // This should not happen with SuccessResponse type, but handle it for safety
          return fail({
            action,
            reason: `Unexpected response status: ${JSON.stringify(result.sendResult, null, 2)}`,
          });
        }

        case HyperliquidAction.SEND_PERP_USDC: {
          if (!abilityParams.sendPerpUsdc) {
            return fail({ action, reason: 'Send perp USDC parameters are required' });
          }

          const result = await sendPerpUsdc({
            transport,
            pkpPublicKey: delegatorPkpInfo.publicKey,
            destination: abilityParams.sendPerpUsdc.destination,
            amount: abilityParams.sendPerpUsdc.amount,
            useTestnet,
          });

          // SuccessResponse always has status "ok", errors are thrown as exceptions
          if (result.sendResult.status === 'ok') {
            return succeed({ action, sendResult: result.sendResult });
          }

          // This should not happen with SuccessResponse type, but handle it for safety
          return fail({
            action,
            reason: `Unexpected response status: ${JSON.stringify(result.sendResult, null, 2)}`,
          });
        }

        case HyperliquidAction.TRANSFER_TO_SPOT:
        case HyperliquidAction.TRANSFER_TO_PERP: {
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

          // SuccessResponse always has status "ok", errors are thrown as exceptions
          if (result.transferResult.status === 'ok') {
            return succeed({ action, transferResult: result.transferResult });
          }

          // This should not happen with SuccessResponse type, but handle it for safety
          return fail({
            action,
            reason: `Unexpected response status: ${JSON.stringify(result.transferResult, null, 2)}`,
          });
        }

        case HyperliquidAction.SPOT_BUY:
        case HyperliquidAction.SPOT_SELL: {
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

        case HyperliquidAction.PERP_LONG:
        case HyperliquidAction.PERP_SHORT: {
          if (!abilityParams.perp) {
            return fail({ action, reason: 'Perp trade parameters are required' });
          }

          const result = await executePerpOrder({
            transport,
            pkpPublicKey: delegatorPkpInfo.publicKey,
            params: {
              symbol: abilityParams.perp.symbol,
              price: abilityParams.perp.price,
              size: abilityParams.perp.size,
              isLong: action === 'perpLong',
              reduceOnly: abilityParams.perp.reduceOnly,
              orderType: abilityParams.perp.orderType,
              leverage: {
                leverage: abilityParams.perp.leverage,
                isCross: abilityParams.perp.isCross ?? true,
              },
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

        case HyperliquidAction.CANCEL_ORDER: {
          if (!abilityParams.cancelOrder) {
            return fail({ action, reason: 'Cancel order parameters are required' });
          }

          const result = await cancelOrder({
            transport,
            pkpPublicKey: delegatorPkpInfo.publicKey,
            params: {
              symbol: abilityParams.cancelOrder.symbol,
              orderId: abilityParams.cancelOrder.orderId,
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

        case HyperliquidAction.CANCEL_ALL_ORDERS_FOR_SYMBOL: {
          if (!abilityParams.cancelAllOrdersForSymbol) {
            return fail({ action, reason: 'Cancel all orders for symbol parameters are required' });
          }

          const result = await cancelAllOrdersForSymbol({
            transport,
            pkpPublicKey: delegatorPkpInfo.publicKey,
            symbol: abilityParams.cancelAllOrdersForSymbol.symbol,
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
