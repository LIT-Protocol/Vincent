import {
  delegator,
  delegatee,
  funder,
  appManager,
  ensureUnexpiredCapacityToken,
  getChainHelpers,
  getEnv,
  type PkpInfo,
  setupVincentDevelopmentEnvironment,
} from '@lit-protocol/vincent-e2e-test-utils';
import { type PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import * as util from 'node:util';
import { z } from 'zod';
import { ethers, type Wallet, type providers } from 'ethers';
import * as hyperliquid from '@nktkas/hyperliquid';

import { HyperliquidAction, bundledVincentAbility as hyperliquidBundledAbility } from '../../src';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Hyperliquid Ability E2E Withdraw Tests', () => {
  const ENV = getEnv({
    ARBITRUM_RPC_URL: z.string(),
  });
  const USE_TESTNET = true;
  const WITHDRAW_AMOUNT_USDC = '5000000'; // 5.0 USDC

  let agentPkpInfo: PkpInfo;
  let wallets: {
    appDelegatee: Wallet;
    funder: Wallet;
    appManager: Wallet;
    agentWalletOwner: Wallet;
  };
  let transport: hyperliquid.HttpTransport;
  let infoClient: hyperliquid.InfoClient;
  let arbitrumRpcProvider: providers.JsonRpcProvider;

  beforeAll(async () => {
    await funder.checkFunderBalance();
    await delegatee.ensureAppDelegateeFunded();
    await appManager.ensureAppManagerFunded();

    const chainHelpers = await getChainHelpers();
    wallets = chainHelpers.wallets;

    await ensureUnexpiredCapacityToken(wallets.appDelegatee);

    const PERMISSION_DATA: PermissionData = {
      // Hyperliquid Ability has no policies
      [hyperliquidBundledAbility.ipfsCid]: {},
    };

    const vincentDevEnvironment = await setupVincentDevelopmentEnvironment({
      permissionData: PERMISSION_DATA,
    });
    agentPkpInfo = vincentDevEnvironment.agentPkpInfo;
    wallets = vincentDevEnvironment.wallets;

    transport = new hyperliquid.HttpTransport({ isTestnet: USE_TESTNET });
    infoClient = new hyperliquid.InfoClient({ transport });
    arbitrumRpcProvider = new ethers.providers.JsonRpcProvider(ENV.ARBITRUM_RPC_URL);
  });

  afterAll(async () => {
    await disconnectVincentAbilityClients();
  });

  describe('[Withdraw] Withdraw USDC from Hyperliquid to Arbitrum', () => {
    let initialPerpBalance: string;
    let initialArbitrumBalance: ethers.BigNumber;

    beforeAll(async () => {
      // Get initial perp balance before withdraw
      const perpState = await infoClient.clearinghouseState({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      if (perpState.marginSummary) {
        initialPerpBalance = perpState.marginSummary.accountValue;
        console.log(`[beforeAll] Initial perp balance: ${initialPerpBalance} USDC`);
      } else {
        throw new Error('No perp balance found. Please ensure funds are in perp account.');
      }

      // Get initial Arbitrum USDC balance
      // Note: For testnet, we'll check ETH balance instead since testnet USDC address may differ
      initialArbitrumBalance = await arbitrumRpcProvider.getBalance(agentPkpInfo.ethAddress);
      console.log(
        `[beforeAll] Initial Arbitrum ETH balance: ${ethers.utils.formatEther(initialArbitrumBalance)} ETH`,
      );
    });

    it('should run precheck for withdraw', async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
        debug: false,
      });

      const precheckResult = await hyperliquidAbilityClient.precheck(
        {
          action: HyperliquidAction.WITHDRAW,
          useTestnet: USE_TESTNET,
          withdraw: {
            amount: WITHDRAW_AMOUNT_USDC,
            // Destination is optional, will default to PKP address
          },
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(precheckResult).toBeDefined();
      console.log('[hould run precheck for withdraw]', util.inspect(precheckResult, { depth: 10 }));

      if (precheckResult.success === false) {
        throw new Error(precheckResult.runtimeError);
      }

      expect(precheckResult.result).toBeDefined();
      expect(precheckResult.result.action).toBe(HyperliquidAction.WITHDRAW);
    });

    it(`should execute withdrawal of ${ethers.utils.formatUnits(WITHDRAW_AMOUNT_USDC, 6)} USDC to Arbitrum`, async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
        debug: false,
      });

      const executeResult = await hyperliquidAbilityClient.execute(
        {
          action: HyperliquidAction.WITHDRAW,
          useTestnet: USE_TESTNET,
          withdraw: {
            amount: WITHDRAW_AMOUNT_USDC,
            destination: agentPkpInfo.ethAddress, // Explicitly set destination
          },
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(executeResult).toBeDefined();
      console.log(
        `[should execute withdrawal of ${ethers.utils.formatUnits(WITHDRAW_AMOUNT_USDC, 6)} USDC to Arbitrum]`,
        util.inspect(executeResult, { depth: 10 }),
      );

      expect(executeResult.success).toBe(true);
      if (executeResult.success === false) {
        throw new Error(executeResult.runtimeError);
      }

      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.action).toBe(HyperliquidAction.WITHDRAW);
      expect(executeResult.result.withdrawResult).toBeDefined();
    });

    it('should verify perp balance decreased after withdrawal', async () => {
      // Wait a bit for withdrawal to process
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Get perp balance after withdrawal
      const perpState = await infoClient.clearinghouseState({
        user: agentPkpInfo.ethAddress as `0x${string}`,
      });

      expect(perpState).toBeDefined();
      console.log(
        '[should verify perp balance decreased after withdrawal] State after withdrawal',
        util.inspect(perpState, { depth: 10 }),
      );

      if (perpState.marginSummary) {
        const finalPerpBalance = perpState.marginSummary.accountValue;
        console.log(
          '[should verify perp balance decreased after withdrawal] Initial perp balance:',
          initialPerpBalance,
          'USDC',
        );
        console.log(
          '[should verify perp balance decreased after withdrawal] Final perp balance:',
          finalPerpBalance,
          'USDC',
        );

        // Convert to numbers for comparison
        const initialBalanceNum = parseFloat(initialPerpBalance);
        const finalBalanceNum = parseFloat(finalPerpBalance);
        const withdrawAmountNum = parseFloat(ethers.utils.formatUnits(WITHDRAW_AMOUNT_USDC, 6));

        console.log(
          '[should verify perp balance decreased after withdrawal] Expected decrease:',
          withdrawAmountNum,
          'USDC',
        );
        console.log(
          '[should verify perp balance decreased after withdrawal] Actual decrease:',
          initialBalanceNum - finalBalanceNum,
          'USDC',
        );
        expect(finalBalanceNum).toBeLessThan(initialBalanceNum);
      } else {
        console.log(
          '[should verify perp balance decreased after withdrawal] Warning: No margin summary found after withdrawal',
        );
      }
    });
  });
});
