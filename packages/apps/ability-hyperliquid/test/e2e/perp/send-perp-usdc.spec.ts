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

describe('Hyperliquid Ability E2E Send Perp USDC Tests', () => {
  const USE_TESTNET = true;
  const SEND_AMOUNT_USDC = '1000000'; // 1.0 USDC using standard 6 decimals
  const USDC_DECIMALS = 6; // Standard USDC decimals

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

  describe('[Send Perp USDC] Send USDC to another Hyperliquid perp account', () => {
    let initialSenderBalance: string;
    let initialRecipientBalance: string;

    beforeAll(async () => {
      // Get initial sender perp balance
      const senderPerpState = await infoClient.clearinghouseState({
        user: agentPkpInfo.ethAddress,
      });

      initialSenderBalance = senderPerpState.marginSummary.accountValue;
      console.log(`[beforeAll] Initial sender perp USDC balance: ${initialSenderBalance}`);

      // Check if sender has sufficient balance
      const senderBalanceNum = parseFloat(initialSenderBalance);
      const requiredAmount = parseFloat(ethers.utils.formatUnits(SEND_AMOUNT_USDC, USDC_DECIMALS));

      if (senderBalanceNum < requiredAmount) {
        throw new Error(
          `Insufficient perp balance. Available: ${initialSenderBalance} USDC, Required: ${requiredAmount} USDC. Please transfer funds to perp account.`,
        );
      }

      // Get initial recipient perp balance
      const recipientPerpState = await infoClient.clearinghouseState({
        user: RECIPIENT_ADDRESS,
      });

      initialRecipientBalance = recipientPerpState.marginSummary.accountValue;
      console.log(`[beforeAll] Initial recipient perp USDC balance: ${initialRecipientBalance}`);
    });

    it('should run precheck for send perp USDC', async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
        debug: false,
      });

      const precheckResult = await hyperliquidAbilityClient.precheck(
        {
          action: HyperliquidAction.SEND_PERP_USDC,
          useTestnet: USE_TESTNET,
          sendPerpUsdc: {
            destination: RECIPIENT_ADDRESS,
            amount: SEND_AMOUNT_USDC,
          },
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(precheckResult).toBeDefined();
      console.log(
        '[should run precheck for send perp USDC]',
        util.inspect(precheckResult, { depth: 10 }),
      );

      if (precheckResult.success === false) {
        throw new Error(precheckResult.runtimeError);
      }

      expect(precheckResult.result).toBeDefined();
      expect(precheckResult.result.action).toBe(HyperliquidAction.SEND_PERP_USDC);
    });

    it(`should execute send of ${ethers.utils.formatUnits(SEND_AMOUNT_USDC, USDC_DECIMALS)} USDC`, async () => {
      const hyperliquidAbilityClient = getVincentAbilityClient({
        bundledVincentAbility: hyperliquidBundledAbility,
        ethersSigner: wallets.appDelegatee,
        debug: true,
      });

      const executeResult = await hyperliquidAbilityClient.execute(
        {
          action: HyperliquidAction.SEND_PERP_USDC,
          useTestnet: USE_TESTNET,
          sendPerpUsdc: {
            destination: RECIPIENT_ADDRESS,
            amount: SEND_AMOUNT_USDC,
          },
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      expect(executeResult).toBeDefined();
      console.log(
        `[should execute send perp USDC of ${ethers.utils.formatUnits(SEND_AMOUNT_USDC, USDC_DECIMALS)} USDC]`,
        util.inspect(executeResult, { depth: 10 }),
      );

      expect(executeResult.success).toBe(true);
      if (executeResult.success === false) {
        throw new Error(executeResult.runtimeError);
      }

      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.action).toBe(HyperliquidAction.SEND_PERP_USDC);
      expect(executeResult.result.sendResult).toBeDefined();
    });

    it('should check balances changed after send perp USDC', async () => {
      // Wait a bit for send to process
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Get sender balance after send
      const senderPerpState = await infoClient.clearinghouseState({
        user: agentPkpInfo.ethAddress,
      });

      const finalSenderBalance = senderPerpState.marginSummary.accountValue;

      // Get recipient balance after send
      const recipientPerpState = await infoClient.clearinghouseState({
        user: RECIPIENT_ADDRESS,
      });

      const finalRecipientBalance = recipientPerpState.marginSummary.accountValue;

      console.log(
        '[should verify balances changed after send] Initial sender balance:',
        initialSenderBalance,
        'USDC',
      );
      console.log(
        '[should verify balances changed after send] Final sender balance:',
        finalSenderBalance,
        'USDC',
      );
      console.log(
        '[should verify balances changed after send] Initial recipient balance:',
        initialRecipientBalance,
        'USDC',
      );
      console.log(
        '[should verify balances changed after send] Final recipient balance:',
        finalRecipientBalance,
        'USDC',
      );

      // Convert to numbers for comparison
      const initialSenderNum = parseFloat(initialSenderBalance);
      const finalSenderNum = parseFloat(finalSenderBalance);
      const initialRecipientNum = parseFloat(initialRecipientBalance);
      const finalRecipientNum = parseFloat(finalRecipientBalance);
      const sendAmountNum = parseFloat(ethers.utils.formatUnits(SEND_AMOUNT_USDC, USDC_DECIMALS));

      console.log(
        '[should verify balances changed after send] Expected sender decrease:',
        sendAmountNum,
        'USDC',
      );
      console.log(
        '[should verify balances changed after send] Actual sender decrease:',
        initialSenderNum - finalSenderNum,
        'USDC',
      );
      console.log(
        '[should verify balances changed after send] Expected recipient increase:',
        sendAmountNum,
        'USDC',
      );
      console.log(
        '[should verify balances changed after send] Actual recipient increase:',
        finalRecipientNum - initialRecipientNum,
        'USDC',
      );

      // Sender balance should decrease
      expect(finalSenderNum).toBeLessThan(initialSenderNum);

      // Recipient balance should increase
      expect(finalRecipientNum).toBeGreaterThan(initialRecipientNum);
    });
  });
});
