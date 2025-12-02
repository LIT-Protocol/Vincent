import { config } from 'dotenv';
import { setupVincentDevelopmentEnvironment, getEnv } from '@lit-protocol/vincent-e2e-test-utils';
import {
  getVincentAbilityClient,
  disconnectVincentAbilityClients,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import { base } from 'viem/chains';
import { toHex } from 'viem';

import {
  bundledVincentAbility as relayLinkAbility,
  getRelayLinkQuote,
  toVincentUserOp,
  relayTransactionToUserOp,
  submitSignedUserOp,
} from '../../src/index';

config();

jest.setTimeout(300000);

describe('Relay.link Ability with Smart Account', () => {
  afterAll(async () => {
    await disconnectVincentAbilityClients();
  });

  it('should deploy smart account and sign Relay.link transaction', async () => {
    const PERMISSION_DATA = {
      [relayLinkAbility.ipfsCid]: {},
    };

    const { agentPkpInfo, wallets, smartAccount } = await setupVincentDevelopmentEnvironment({
      permissionData: PERMISSION_DATA,
      enableSmartAccount: true,
    });

    expect(smartAccount).toBeDefined();
    expect(smartAccount?.account.address).toMatch(/^0x[a-fA-F0-9]{40}$/);

    const relayClient = getVincentAbilityClient({
      bundledVincentAbility: relayLinkAbility,
      ethersSigner: wallets.appDelegatee,
      debug: false,
    });

    const userAddress = smartAccount?.account.address || agentPkpInfo.ethAddress;

    // Get quote for ETH -> USDC swap on Base
    const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
    const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

    const quote = await getRelayLinkQuote({
      user: userAddress,
      originChainId: 8453,
      destinationChainId: 8453,
      originCurrency: ETH_ADDRESS,
      destinationCurrency: USDC_ADDRESS,
      amount: '100000000000000', // 0.0001 ETH
      tradeType: 'EXACT_INPUT',
      useReceiver: true,
      protocolVersion: 'preferV2',
      userOperationGasOverhead: smartAccount ? 300000 : undefined,
    });

    if (!quote.steps || quote.steps.length === 0) {
      throw new Error('No steps found in quote response');
    }

    let lastTransactionResult: any = null;

    for (const step of quote.steps) {
      if (!step.items || step.items.length === 0) {
        continue;
      }

      const item = step.items[0];

      if (step.kind === 'signature') {
        throw new Error('Signature step execution not yet implemented');
      } else if (step.kind === 'transaction') {
        const txData = item.data;

        if (!txData || !txData.to) {
          throw new Error('No valid transaction data found in transaction step');
        }

        if (smartAccount) {
          const env = getEnv();

          const userOp = await relayTransactionToUserOp({
            permittedAddress: agentPkpInfo.ethAddress as `0x${string}`,
            serializedPermissionAccount: smartAccount.serializedPermissionAccount,
            transaction: {
              to: txData.to as `0x${string}`,
              data: txData.data as `0x${string}`,
              value: txData.value || '0',
              chainId: txData.chainId,
              from: smartAccount.account.address as `0x${string}`,
            },
            chain: base,
            rpcUrl: env.BASE_RPC_URL!,
            zerodevRpcUrl: env.ZERODEV_RPC_URL!,
          });

          const hexUserOperation = Object.fromEntries(
            Object.entries(userOp).map(([key, value]) => {
              if (typeof value === 'number' || typeof value === 'bigint') {
                return [key, toHex(value)];
              }
              return [key, value];
            }),
          );

          const vincentUserOp = toVincentUserOp(hexUserOperation as any);

          const relayParams = {
            alchemyRpcUrl: env.BASE_RPC_URL!,
            entryPointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032' as `0x${string}`,
            userOp: vincentUserOp,
          };

          const relayExecuteResult = await relayClient.execute(relayParams, {
            delegatorPkpEthAddress: agentPkpInfo.ethAddress,
          });

          if (!relayExecuteResult.success) {
            throw new Error(
              `Ability execution failed: ${relayExecuteResult.runtimeError || 'Unknown error'}`,
            );
          }

          const { userOpHash, transactionHash } = await submitSignedUserOp({
            permittedAddress: agentPkpInfo.ethAddress as `0x${string}`,
            serializedPermissionAccount: smartAccount.serializedPermissionAccount,
            userOpSignature: relayExecuteResult.result.signature,
            userOp: hexUserOperation,
            chain: base,
            zerodevRpcUrl: env.ZERODEV_RPC_URL!,
          });

          lastTransactionResult = {
            ...relayExecuteResult,
            transactionHash,
            userOpHash,
          };
        } else {
          const relayParams = {
            alchemyRpcUrl: env.BASE_RPC_URL!,
            transaction: {
              ...txData,
              from: agentPkpInfo.ethAddress,
            },
          };

          const relayPrecheckResult = await relayClient.precheck(relayParams, {
            delegatorPkpEthAddress: agentPkpInfo.ethAddress,
          });

          if (!relayPrecheckResult.success) {
            throw new Error(
              `Ability precheck failed: ${relayPrecheckResult.runtimeError || 'Unknown error'}`,
            );
          }

          const relayExecuteResult = await relayClient.execute(relayParams, {
            delegatorPkpEthAddress: agentPkpInfo.ethAddress,
          });

          if (!relayExecuteResult.success) {
            throw new Error(
              `Ability execution failed: ${relayExecuteResult.runtimeError || 'Unknown error'}`,
            );
          }

          lastTransactionResult = relayExecuteResult;
        }
      }
    }

    // Verify transaction was executed successfully
    expect(lastTransactionResult).toBeDefined();
    expect(lastTransactionResult.success).toBe(true);
    expect(lastTransactionResult.result.signature).toBeDefined();

    if (smartAccount && lastTransactionResult.transactionHash) {
      expect(lastTransactionResult.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(lastTransactionResult.userOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    }
  });
});
