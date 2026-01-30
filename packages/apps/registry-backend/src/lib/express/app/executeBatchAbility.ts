import type { Address, Chain } from 'viem';

import { deserializePermissionAccount } from '@zerodev/permissions';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { createKernelAccountClient } from '@zerodev/sdk';
import { getEntryPoint, KERNEL_V3_3 } from '@zerodev/sdk/constants';
import { Wallet } from 'ethers';
import { createPublicClient, http, toHex } from 'viem';
import { entryPoint07Address } from 'viem/account-abstraction';

import {
  toVincentUserOp,
  bundledVincentAbility as relayLinkAbility,
  getRelayLinkQuote,
  relayTransactionToUserOp,
} from '@lit-protocol/vincent-ability-relay-link';
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';
import {
  createVincentViemPkpSigner,
  wrapKernelAccountWithUserOpCapture,
} from '@lit-protocol/vincent-app-sdk/utils';

import { env } from '../../../env';
import { getSmartAccountChain } from '../../chainConfig';
import { getContractClient } from '../../contractClient';
import { getSerializedPermissionAccount } from '../../getSerializedPermissionAccount';

/**
 * Context passed to ability preparation functions
 */
export interface AbilityPreparationContext {
  abilityParams: DelegatorAbilityParams;
  defaults: ExecuteBatchDefaults;
  agentSmartAccountAddress: Address;
  agentSignerAddress: Address;
  serializedPermissionAccount: string;
  chain: Chain;
  rpcUrl: string;
  zerodevProjectId: string;
}

/**
 * Result from ability preparation - the params to pass to precheck/execute
 */
export interface PreparedAbilityParams {
  [key: string]: any;
}

/**
 * Ability configuration with preparation function
 */
export interface AbilityConfig {
  /** Load the bundled ability package */
  loadAbility: () => Promise<any>;
  /** Prepare ability-specific params before execution */
  prepareParams: (context: AbilityPreparationContext) => Promise<PreparedAbilityParams>;
}

/**
 * Mapping of ability names to their configurations
 * Each ability can have custom logic for preparing parameters
 */
const ABILITY_CONFIG_MAP: Record<string, AbilityConfig> = {
  'relay-link': {
    loadAbility: async () => {
      return relayLinkAbility;
    },
    prepareParams: async (context) => {
      // Merge defaults with delegator params
      const finalParams = {
        user: context.abilityParams.USER_ADDRESS ?? context.agentSmartAccountAddress,
        originChainId:
          context.abilityParams.ORIGIN_CHAIN_ID ??
          context.defaults.ORIGIN_CHAIN_ID ??
          context.chain.id,
        destinationChainId:
          context.abilityParams.DESTINATION_CHAIN_ID ??
          context.defaults.DESTINATION_CHAIN_ID ??
          context.chain.id,
        originCurrency: context.abilityParams.ORIGIN_CURRENCY ?? context.defaults.ORIGIN_CURRENCY,
        destinationCurrency:
          context.abilityParams.DESTINATION_CURRENCY ?? context.defaults.DESTINATION_CURRENCY,
        amount: context.abilityParams.AMOUNT ?? context.defaults.AMOUNT,
        tradeType: context.abilityParams.TRADE_TYPE ?? context.defaults.TRADE_TYPE ?? 'EXACT_INPUT',
      };

      // Validate required params
      if (!finalParams.originCurrency || !finalParams.destinationCurrency || !finalParams.amount) {
        throw new Error(
          'Missing required relay-link parameters: ORIGIN_CURRENCY, DESTINATION_CURRENCY, or AMOUNT',
        );
      }

      // Get quote from relay.link
      const quote = await getRelayLinkQuote({
        user: finalParams.user,
        originChainId: finalParams.originChainId,
        destinationChainId: finalParams.destinationChainId,
        originCurrency: finalParams.originCurrency,
        destinationCurrency: finalParams.destinationCurrency,
        amount: finalParams.amount,
        tradeType: finalParams.tradeType as any,
        useReceiver: true,
        protocolVersion: 'preferV2',
      });

      // Find the transaction step
      const txStep = quote.steps.find((step: any) => step.kind === 'transaction');
      if (!txStep) {
        throw new Error('No transaction step found in relay.link quote');
      }

      const txItem = txStep?.items?.[0];
      if (!txItem?.data) {
        throw new Error('No transaction data found in relay.link quote');
      }

      const txData = txItem.data;

      // Convert transaction to UserOp
      const zerodevRpcUrl = `https://rpc.zerodev.app/api/v3/${context.zerodevProjectId}/chain/${context.chain.id}`;

      const userOp = await relayTransactionToUserOp({
        permittedAddress: context.agentSignerAddress,
        serializedPermissionAccount: context.serializedPermissionAccount,
        transaction: {
          to: txData.to as `0x${string}`,
          data: txData.data as `0x${string}`,
          value: txData.value || '0',
          chainId: txData.chainId,
          from: context.agentSmartAccountAddress,
        },
        chain: context.chain as any,
        zerodevRpcUrl,
      });

      // Convert to hex and Vincent UserOp format
      const hexUserOperation = Object.fromEntries(
        Object.entries(userOp).map(([key, value]) => {
          if (typeof value === 'number' || typeof value === 'bigint') {
            return [key, toHex(value)];
          }
          return [key, value];
        }),
      );

      const vincentUserOp = toVincentUserOp(hexUserOperation as any);

      // Return the ability params for precheck/execute
      return {
        alchemyRpcUrl: env.ALCHEMY_SIMULATION_RPC_URL,
        userOp: vincentUserOp,
        entryPointAddress: entryPoint07Address,
        // Store txData for later use in sendUserOperation
        _txData: txData,
        _zerodevRpcUrl: zerodevRpcUrl,
      };
    },
  },
  // Add more abilities here as needed
  // 'uniswap-swap': {
  //   loadAbility: async () => { ... },
  //   prepareParams: async (context) => { ... },
  // },
};

/**
 * Default values that can be overridden per delegator
 */
export interface ExecuteBatchDefaults {
  [key: string]: any;
}

/**
 * Ability parameters for a single delegator's execution
 */
export interface DelegatorAbilityParams {
  [key: string]: any;
}

/**
 * Request for batch execution
 */
export interface ExecuteBatchRequest {
  delegateePrivateKey: string;
  abilityName: string;
  defaults?: ExecuteBatchDefaults;
  delegators: Array<{
    delegatorAddress: Address;
    abilityParams: DelegatorAbilityParams;
  }>;
}

/**
 * Successful execution result for a delegator
 */
export interface DelegatorExecutionResultSuccess {
  success: true;
  transactionHash: string;
  userOpHash: string;
}

/**
 * Failed execution result for a delegator
 */
export interface DelegatorExecutionResultFailure {
  success: false;
  error: string;
}

/**
 * Result for a single delegator execution
 */
export type DelegatorExecutionResult =
  | DelegatorExecutionResultSuccess
  | DelegatorExecutionResultFailure;

/**
 * Response for batch execution
 */
export interface ExecuteBatchResponse {
  results: Record<string, DelegatorExecutionResult>;
}

/**
 * Execute a Vincent ability for multiple delegators in batch
 */
export async function executeBatchAbility(
  request: ExecuteBatchRequest,
): Promise<ExecuteBatchResponse> {
  const { delegateePrivateKey, abilityName, defaults = {}, delegators } = request;

  const smartAccountChain = getSmartAccountChain();
  const ethersWallet = new Wallet(delegateePrivateKey);
  const delegateeAddress = ethersWallet.address as Address;
  const contractClient = getContractClient();
  const appId = await contractClient.getAppIdByDelegatee({
    delegateeAddress,
  });
  if (!appId) {
    throw new Error(
      `No app found for delegatee address ${delegateeAddress}. The delegatee must be registered for an app.`,
    );
  }

  const abilityConfig = ABILITY_CONFIG_MAP[abilityName];
  if (!abilityConfig) {
    throw new Error(
      `Ability '${abilityName}' is not supported. Available abilities: ${Object.keys(ABILITY_CONFIG_MAP).join(', ')}`,
    );
  }

  const abilityClient = getVincentAbilityClient({
    bundledVincentAbility: await abilityConfig.loadAbility(),
    ethersSigner: ethersWallet,
    registryRpcUrl: env.VINCENT_REGISTRY_RPC_URL,
    debug: false,
  });

  // Execute for each delegator
  const results: Record<string, DelegatorExecutionResult> = {};

  for (const { delegatorAddress, abilityParams } of delegators) {
    try {
      const { serializedPermissionAccount, agentSmartAccountAddress, agentSignerAddress } =
        await getSerializedPermissionAccount({
          userControllerAddress: delegatorAddress,
          appId,
        });

      const preparedParams = await abilityConfig.prepareParams({
        abilityParams,
        defaults,
        agentSmartAccountAddress,
        agentSignerAddress,
        serializedPermissionAccount,
        chain: smartAccountChain as any,
        rpcUrl: env.SMART_ACCOUNT_CHAIN_RPC_URL,
        zerodevProjectId: env.ZERODEV_PROJECT_ID,
      });

      // Extract special params (prefixed with _) that shouldn't be sent to precheck/execute
      const { _txData, _zerodevRpcUrl, ...abilityParamsForExecution } = preparedParams;

      const precheckResult = await abilityClient.precheck(abilityParamsForExecution, {
        delegatorPkpEthAddress: agentSignerAddress,
        agentAddress: agentSmartAccountAddress,
      });

      if (!precheckResult.success) {
        throw new Error(`Precheck failed: ${precheckResult.runtimeError || 'Unknown error'}`);
      }

      // Create PKP signer with callback that uses the ability to sign
      const pkpSigner = createVincentViemPkpSigner({
        pkpAddress: agentSignerAddress,
        onSignUserOpHash: async ({ userOp }: { userOp: any }) => {
          // Convert bigint values to hex
          const hexUserOperationForSigning = Object.fromEntries(
            Object.entries(userOp).map(([key, value]) => {
              if (typeof value === 'number' || typeof value === 'bigint') {
                return [key, toHex(value)];
              }
              return [key, value];
            }),
          );

          const vincentUserOpForSigning = toVincentUserOp(hexUserOperationForSigning as any);

          const signingAbilityParams = {
            ...abilityParamsForExecution,
            userOp: vincentUserOpForSigning,
          };

          // Call ability to sign
          const executeResult = await abilityClient.execute(signingAbilityParams, {
            delegatorPkpEthAddress: agentSignerAddress,
            agentAddress: agentSmartAccountAddress,
          });

          if (!executeResult.success) {
            throw new Error(executeResult.runtimeError || 'Signing failed');
          }

          // @ts-expect-error - TODO: fix this typing
          return executeResult.result!.signature! as `0x${string}`;
        },
      });

      // Create ECDSA signer from PKP signer
      const pkpEcdsaSigner = await toECDSASigner({ signer: pkpSigner as any });

      // Deserialize permission account
      const publicClient = createPublicClient({
        chain: smartAccountChain as any,
        transport: http(env.SMART_ACCOUNT_CHAIN_RPC_URL),
      });
      const rawDeserializedAccount = await deserializePermissionAccount(
        publicClient,
        getEntryPoint('0.7'),
        KERNEL_V3_3,
        serializedPermissionAccount,
        pkpEcdsaSigner,
      );

      // Wrap account to intercept UserOps
      const deserializedAccount = wrapKernelAccountWithUserOpCapture(
        rawDeserializedAccount,
        pkpSigner,
      );

      const kernelClient = createKernelAccountClient({
        account: deserializedAccount,
        chain: smartAccountChain as any,
        bundlerTransport: http(_zerodevRpcUrl as string),
        client: publicClient,
      });

      const userOpHash = await kernelClient.sendUserOperation({
        callData: await deserializedAccount.encodeCalls([
          {
            to: _txData.to as `0x${string}`,
            value: BigInt(_txData.value || '0'),
            data: _txData.data as `0x${string}`,
          },
        ]),
      });

      const receipt = await kernelClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      const transactionHash = receipt.receipt.transactionHash;

      results[delegatorAddress] = {
        success: true,
        transactionHash,
        userOpHash,
      };
    } catch (error) {
      console.error(`[executeBatchAbility] Error for ${delegatorAddress}:`, error);
      results[delegatorAddress] = {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  return { results };
}
