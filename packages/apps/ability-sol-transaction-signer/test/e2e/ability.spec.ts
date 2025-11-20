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
import { type Wallet } from 'ethers';

import { bundledVincentAbility as solTransactionSignerBundledAbility } from '../../src';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('Solana Transaction Signer Ability E2E Tests', () => {
  const ENV = getEnv({
    SOLANA_RPC_URL: z.string().optional(),
    SOLANA_CLUSTER: z.enum(['devnet', 'testnet', 'mainnet-beta']),
  });
  const FAUCET_FUND_AMOUNT = 0.01 * LAMPORTS_PER_SOL;
  const TX_SEND_AMOUNT = 0.001 * LAMPORTS_PER_SOL;

  let agentPkpInfo: PkpInfo;
  let wallets: {
    appDelegatee: Wallet;
    funder: Wallet;
    appManager: Wallet;
    agentWalletOwner: Wallet;
  };

  beforeAll(async () => {
    await funder.checkFunderBalance();
    await delegatee.ensureAppDelegateeFunded();
    await appManager.ensureAppManagerFunded();

    const chainHelpers = await getChainHelpers();
    wallets = chainHelpers.wallets;

    await ensureUnexpiredCapacityToken(wallets.appDelegatee);

    const PERMISSION_DATA: PermissionData = {
      // Solana Transaction Signer Ability has no policies
      [solTransactionSignerBundledAbility.ipfsCid]: {},
    };

    const vincentDevEnvironment = await setupVincentDevelopmentEnvironment({
      permissionData: PERMISSION_DATA,
    });
    agentPkpInfo = vincentDevEnvironment.agentPkpInfo;
    wallets = vincentDevEnvironment.wallets;
  });

  afterAll(async () => {
    await disconnectVincentAbilityClients();
  });

  describe('Foo', () => {
    // it('should execute the HyperLiquid Ability precheck method for transfer to spot', async () => {
    //   const hyperliquidAbilityClient = getVincentAbilityClient({
    //     bundledVincentAbility: hyperliquidBundledAbility,
    //     ethersSigner: wallets.appDelegatee,
    //     debug: false,
    //   });
    //   const precheckResult = await hyperliquidAbilityClient.precheck(
    //     {
    //       action: 'transferToSpot',
    //       useTestnet: USE_TESTNET,
    //       transfer: {
    //         amount: USDC_TRANSFER_AMOUNT,
    //       },
    //       arbitrumRpcUrl: ENV.ARBITRUM_RPC_URL,
    //     },
    //     {
    //       delegatorPkpEthAddress: agentPkpInfo.ethAddress,
    //     },
    //   );
    //   expect(precheckResult).toBeDefined();
    //   console.log(
    //     '[should successfully run precheck on the Hyperliquid Ability for transfer to spot]',
    //     util.inspect(precheckResult, { depth: 10 }),
    //   );
    //   if (precheckResult.success === false) {
    //     throw new Error(precheckResult.runtimeError);
    //   }
    //   expect(precheckResult.result).toBeDefined();
    //   expect(precheckResult.result.action).toBe('transferToSpot');
    //   expect(parseFloat(precheckResult.result.availableBalance as string)).toBeGreaterThan(0);
    // });
  });
});
