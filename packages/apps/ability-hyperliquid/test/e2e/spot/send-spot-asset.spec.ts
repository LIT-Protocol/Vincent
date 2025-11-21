import {
  delegatee,
  funder,
  appManager,
  ensureUnexpiredCapacityToken,
  getChainHelpers,
  type PkpInfo,
  setupVincentDevelopmentEnvironment,
} from '@lit-protocol/vincent-e2e-test-utils';
import { type PermissionData } from '@lit-protocol/vincent-contracts-sdk';
import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import * as util from 'node:util';
import { ethers, type Wallet } from 'ethers';
import * as hyperliquid from '@nktkas/hyperliquid';

import {
  HyperliquidAction,
  bundledVincentAbility as hyperliquidBundledAbility,
} from '../../../src';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Hyperliquid Ability E2E Send Spot Asset Tests', () => {
  const USE_TESTNET = true;
  const SEND_AMOUNT = '100000000'; // 1.0 USDC using 8 decimals as per Hyperliquid precision
  const HYPERLIQUID_PRECISION = 8; // 8 decimals as per Hyperliquid precision for USDC
  const TOKEN = 'USDC';
  // const SEND_AMOUNT = '10000';
  // const HYPERLIQUID_PRECISION = 5;
  // const TOKEN = 'PURR';

  // Vincent Ability Hyperliquid E2E Test USDC Funder from Bitwarden
  // See README.md for more details (Funding on Hyperliquid Testnet section)
  const RECIPIENT_ADDRESS = '0x7787794D6F3d2f71ba02D51aec2265AA09D86Cb9';

  let agentPkpInfo: PkpInfo;
  let wallets: {
    appDelegatee: Wallet;
    funder: Wallet;
    appManager: Wallet;
    agentWalletOwner: Wallet;
  };
  let transport: hyperliquid.HttpTransport;
  let infoClient: hyperliquid.InfoClient;

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
  });

  afterAll(async () => {
    await disconnectVincentAbilityClients();
  });

  describe(`[Send Spot Asset] Send ${TOKEN} to another Hyperliquid spot account`, () => {
    let initialSenderBalance: string;
    let initialRecipientBalance: string;

    beforeAll(async () => {
      // Get initial sender spot balance
      const senderSpotState = await infoClient.spotClearinghouseState({
        user: agentPkpInfo.ethAddress,
      });

      const senderUsdcBalance = senderSpotState.balances.find((b) => b.coin === TOKEN);
      if (senderUsdcBalance) {
        initialSenderBalance = senderUsdcBalance.total;
        console.log(`[beforeAll] Initial sender ${TOKEN} balance: ${initialSenderBalance}`);
      } else {
        throw new Error(
          `No ${TOKEN} balance found in sender spot account. Please ensure funds are in spot account.`,
        );
      }

      // Get initial recipient spot balance
      const recipientSpotState = await infoClient.spotClearinghouseState({
        user: RECIPIENT_ADDRESS,
      });

      const recipientUsdcBalance = recipientSpotState.balances.find((b) => b.coin === TOKEN);
      initialRecipientBalance = recipientUsdcBalance?.total || '0';
      console.log(`[beforeAll] Initial recipient ${TOKEN} balance: ${initialRecipientBalance}`);
    });

    it('should run precheck for send spot asset', async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
        debug: false,
      });

      const precheckResult = await hyperliquidAbilityClient.precheck(
        {
          action: HyperliquidAction.SEND_SPOT_ASSET,
          useTestnet: USE_TESTNET,
          sendSpotAsset: {
            destination: RECIPIENT_ADDRESS,
            token: TOKEN,
            amount: SEND_AMOUNT,
          },
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(precheckResult).toBeDefined();
      console.log(
        '[should run precheck for send spot asset]',
        util.inspect(precheckResult, { depth: 10 }),
      );

      if (precheckResult.success === false) {
        throw new Error(precheckResult.runtimeError);
      }

      expect(precheckResult.result).toBeDefined();
      expect(precheckResult.result.action).toBe(HyperliquidAction.SEND_SPOT_ASSET);
    });

    it(`should execute send of ${ethers.utils.formatUnits(SEND_AMOUNT, HYPERLIQUID_PRECISION)} ${TOKEN}`, async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
        debug: true,
      });

      const executeResult = await hyperliquidAbilityClient.execute(
        {
          action: HyperliquidAction.SEND_SPOT_ASSET,
          useTestnet: USE_TESTNET,
          sendSpotAsset: {
            destination: RECIPIENT_ADDRESS,
            token: TOKEN,
            amount: SEND_AMOUNT,
          },
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(executeResult).toBeDefined();
      console.log(
        `[should execute send spot asset of ${ethers.utils.formatUnits(SEND_AMOUNT, HYPERLIQUID_PRECISION)} ${TOKEN}]`,
        util.inspect(executeResult, { depth: 10 }),
      );

      expect(executeResult.success).toBe(true);
      if (executeResult.success === false) {
        throw new Error(executeResult.runtimeError);
      }

      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.action).toBe(HyperliquidAction.SEND_SPOT_ASSET);
      expect(executeResult.result.sendResult).toBeDefined();
    });

    it('should check balances changed after send spot asset', async () => {
      // Wait a bit for send to process
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Get sender balance after send
      const senderSpotState = await infoClient.spotClearinghouseState({
        user: agentPkpInfo.ethAddress,
      });

      const senderUsdcBalance = senderSpotState.balances.find((b) => b.coin === TOKEN);
      const finalSenderBalance = senderUsdcBalance?.total || '0';

      // Get recipient balance after send
      const recipientSpotState = await infoClient.spotClearinghouseState({
        user: RECIPIENT_ADDRESS,
      });

      const recipientUsdcBalance = recipientSpotState.balances.find((b) => b.coin === TOKEN);
      const finalRecipientBalance = recipientUsdcBalance?.total || '0';

      console.log(
        '[should verify balances changed after send] Initial sender balance:',
        initialSenderBalance,
        TOKEN,
      );
      console.log(
        '[should verify balances changed after send] Final sender balance:',
        finalSenderBalance,
        TOKEN,
      );
      console.log(
        '[should verify balances changed after send] Initial recipient balance:',
        initialRecipientBalance,
        TOKEN,
      );
      console.log(
        '[should verify balances changed after send] Final recipient balance:',
        finalRecipientBalance,
        TOKEN,
      );

      // Convert to numbers for comparison
      const initialSenderNum = parseFloat(initialSenderBalance);
      const finalSenderNum = parseFloat(finalSenderBalance);
      const initialRecipientNum = parseFloat(initialRecipientBalance);
      const finalRecipientNum = parseFloat(finalRecipientBalance);
      const sendAmountNum = parseFloat(
        ethers.utils.formatUnits(SEND_AMOUNT, HYPERLIQUID_PRECISION),
      );

      console.log(
        '[should verify balances changed after send] Expected sender decrease:',
        sendAmountNum,
        TOKEN,
      );
      console.log(
        '[should verify balances changed after send] Actual sender decrease:',
        initialSenderNum - finalSenderNum,
        TOKEN,
      );
      console.log(
        '[should verify balances changed after send] Expected recipient increase:',
        sendAmountNum,
        TOKEN,
      );
      console.log(
        '[should verify balances changed after send] Actual recipient increase:',
        finalRecipientNum - initialRecipientNum,
        TOKEN,
      );

      // Sender balance should decrease
      expect(finalSenderNum).toBeLessThan(initialSenderNum);

      // Recipient balance should increase
      expect(finalRecipientNum).toBeGreaterThan(initialRecipientNum);
    });
  });
});
