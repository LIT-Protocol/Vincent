/**
 * E2E Integration Test for Owner Attestation Signing
 *
 * This test validates the complete flow of signing owner attestations using a Lit Action:
 * 1. Creates a real app on Chronicle Yellowstone (prod)
 * 2. Deposits USDC to Aave through the Fee Diamond on Base Sepolia
 * 3. Withdraws from Aave to collect fees
 * 4. Uses the deployed Lit Action on Datil to sign an owner attestation
 * 5. Withdraws collected app fees using the signature
 * 6. Asserts funds arrived in the app owner wallet
 *
 * This test uses real testnets and the Datil Lit network - no mocking!
 */

import { ethers } from 'ethers';

import {
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitActionResource,
  LitPKPResource,
} from '@lit-protocol/auth-helpers';
import { LIT_ABILITY } from '@lit-protocol/constants';
import { LitNodeClient } from '@lit-protocol/lit-node-client';

import FeeDiamondAbi from '../../abis/FeeDiamond.abi.json';
import {
  VINCENT_CONTRACT_ADDRESS_BOOK,
  VINCENT_LIT_ACTIONS_ADDRESS_BOOK,
  VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
  COMBINED_ABI,
} from '../../src/constants';
import { signOwnerAttestation } from '../../src/fees/signOwnerAttestation';

// Load environment variables from root .env using require
require('dotenv').config();

// Test configuration
const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL;
const CHRONICLE_YELLOWSTONE_RPC_URL = process.env.YELLOWSTONE_RPC_URL;
const BASE_SEPOLIA_CHAIN_ID = 84532;
const CHRONICLE_YELLOWSTONE_CHAIN_ID = 175188;
const TX_WAIT_CONFIRMATIONS = 2;
const LIT_FOUNDATION_APP_ID = 0;

// Private keys from .env
const TEST_BASE_SEPOLIA_PRIVATE_KEY = process.env.TEST_BASE_SEPOLIA_PRIVATE_KEY;
const TEST_APP_OWNER_PRIVATE_KEY = process.env.TEST_APP_OWNER_PRIVATE_KEY;
const AAVE_USDC_PRIVATE_KEY = process.env.AAVE_USDC_PRIVATE_KEY;
const TEST_LIT_FOUNDATION_PRIVATE_KEY = process.env.TEST_LIT_FOUNDATION_PRIVATE_KEY;

// Contract addresses
const FEE_DIAMOND_ADDRESS = VINCENT_CONTRACT_ADDRESS_BOOK.fee[84532].address;
const LIT_ACTION_IPFS_CID = VINCENT_LIT_ACTIONS_ADDRESS_BOOK.signOwnerAttestation.ipfsCid;

// Base Sepolia addresses
const BASE_SEPOLIA_USDC = '0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f'; // USDC on Base Sepolia
const AAVE_POOL_ADDRESS = '0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27'; // Aave Pool on Base Sepolia

// ABIs

const AAVE_POOL_ABI = ['function getReserveAToken(address asset) view returns (address)'];
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
];

// Extend Jest timeout for E2E test (5 minutes)
jest.setTimeout(300000);

describe('Owner Attestation Signing E2E', () => {
  let baseSepoliaProvider: ethers.providers.JsonRpcProvider;
  let yellowstoneProvider: ethers.providers.JsonRpcProvider;
  let testWallet: ethers.Wallet;
  let appOwnerWallet: ethers.Wallet;
  let fundingWallet: ethers.Wallet;
  let litFoundationWallet: ethers.Wallet;
  let litNodeClient: LitNodeClient;
  let appId: number;

  beforeAll(async () => {
    // Validate environment variables
    if (!TEST_BASE_SEPOLIA_PRIVATE_KEY) {
      throw new Error('TEST_BASE_SEPOLIA_PRIVATE_KEY not found in .env');
    }
    if (!TEST_APP_OWNER_PRIVATE_KEY) {
      throw new Error('TEST_APP_OWNER_PRIVATE_KEY not found in .env');
    }
    if (!AAVE_USDC_PRIVATE_KEY) {
      throw new Error('AAVE_USDC_PRIVATE_KEY not found in .env');
    }
    if (!TEST_LIT_FOUNDATION_PRIVATE_KEY) {
      throw new Error('TEST_LIT_FOUNDATION_PRIVATE_KEY not found in .env');
    }

    // Set up providers
    baseSepoliaProvider = new ethers.providers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL);
    yellowstoneProvider = new ethers.providers.JsonRpcProvider(CHRONICLE_YELLOWSTONE_RPC_URL);

    // Set up wallets
    testWallet = new ethers.Wallet(TEST_BASE_SEPOLIA_PRIVATE_KEY, baseSepoliaProvider);
    appOwnerWallet = new ethers.Wallet(TEST_APP_OWNER_PRIVATE_KEY, yellowstoneProvider);
    fundingWallet = new ethers.Wallet(AAVE_USDC_PRIVATE_KEY, baseSepoliaProvider);
    litFoundationWallet = new ethers.Wallet(TEST_LIT_FOUNDATION_PRIVATE_KEY, baseSepoliaProvider);

    console.log('Test wallet (Base Sepolia):', testWallet.address);
    console.log('App owner wallet (Chronicle Yellowstone):', appOwnerWallet.address);
    console.log('Funding wallet (Base Sepolia):', fundingWallet.address);
    console.log('Lit Foundation wallet (Base Sepolia):', litFoundationWallet.address);

    // Initialize Lit Node Client
    litNodeClient = new LitNodeClient({
      litNetwork: 'datil',
      debug: true,
    });
    await litNodeClient.connect();
    console.log('✅ Connected to Lit Network (Datil)');
  });

  afterAll(async () => {
    if (litNodeClient) {
      await litNodeClient.disconnect();
    }
  });

  it('should complete full E2E flow: create app, deposit, withdraw, sign attestation, and collect fees', async () => {
    // Step 1: Create a real app on Chronicle Yellowstone
    console.log('\n📝 Step 1: Creating app on Chronicle Yellowstone...');
    appId = Math.floor(Math.random() * 1000000000); // Random uint40
    console.log('Generated App ID:', appId);

    const vincentDiamond = new ethers.Contract(
      VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
      COMBINED_ABI,
      appOwnerWallet,
    );

    // Check if app already exists
    try {
      const existingApp = await vincentDiamond.getApp(appId);
      if (existingApp.manager !== ethers.constants.AddressZero) {
        console.log('App already exists, using existing app');
      }
    } catch {
      // App doesn't exist, create it
      console.log('Registering new app...');
      // Use a random delegatee for simplicity since the delegatee is irrelevant for this test
      const delegatee = ethers.Wallet.createRandom();
      const delegatees = [delegatee.address];

      // Format: versionAbilities structure
      // abilityIpfsCids: array of ability IPFS CIDs
      // abilityPolicies: array of arrays, one array per ability containing that ability's policies
      const tx = await vincentDiamond.registerApp(appId, delegatees, {
        abilityIpfsCids: ['QmTestAbility1', 'QmTestAbility2'],
        abilityPolicies: [
          ['QmTestPolicy1'], // Policies for first ability
          [], // No policies for second ability
        ],
      });
      await tx.wait(TX_WAIT_CONFIRMATIONS);
      console.log('✅ App registered on Chronicle Yellowstone');
    }

    // Step 2: Fund test wallet with USDC on Base Sepolia
    console.log('\n💰 Step 2: Funding test wallet with USDC...');
    const usdc = new ethers.Contract(BASE_SEPOLIA_USDC, ERC20_ABI, fundingWallet);
    const decimals = await usdc.decimals();
    const usdcDepositAmount = ethers.utils.parseUnits('1000', decimals);

    let testWalletBalance = await usdc.balanceOf(testWallet.address);
    if (testWalletBalance.gte(usdcDepositAmount)) {
      console.log('Test wallet already has enough USDC, skipping transfer');
    } else {
      const fundingBalance = await usdc.balanceOf(fundingWallet.address);
      console.log(
        `Funding wallet USDC balance: ${ethers.utils.formatUnits(fundingBalance, decimals)} USDC`,
      );

      if (fundingBalance.lt(usdcDepositAmount)) {
        throw new Error('Funding wallet does not have enough USDC');
      }

      const transferTx = await usdc.transfer(testWallet.address, usdcDepositAmount);
      await transferTx.wait(TX_WAIT_CONFIRMATIONS);
      console.log(
        `✅ Transferred ${ethers.utils.formatUnits(usdcDepositAmount, decimals)} USDC to test wallet`,
      );

      testWalletBalance = await usdc.balanceOf(testWallet.address);
      console.log(
        `Test wallet USDC balance after possible transfer: ${ethers.utils.formatUnits(testWalletBalance, decimals)} USDC`,
      );
    }

    // Step 3: Deposit USDC to Aave through Fee Diamond
    console.log('\n📥 Step 3: Depositing USDC to Aave through Fee Diamond...');
    const feeDiamond = new ethers.Contract(FEE_DIAMOND_ADDRESS, FeeDiamondAbi, testWallet);
    const usdcConnected = usdc.connect(testWallet);

    console.log(`Approving ${ethers.utils.formatUnits(usdcDepositAmount, decimals)} USDC...`);

    const approveTx = await usdcConnected.approve(FEE_DIAMOND_ADDRESS, usdcDepositAmount);
    await approveTx.wait(TX_WAIT_CONFIRMATIONS);
    console.log('✅ Approved USDC');

    console.log('Depositing to Aave...');
    const depositTx = await feeDiamond.depositToAave(appId, BASE_SEPOLIA_USDC, usdcDepositAmount);
    await depositTx.wait(TX_WAIT_CONFIRMATIONS);
    console.log('✅ Deposited to Aave');

    // Verify deposit
    const depositInfo = await feeDiamond.deposits(appId, testWallet.address, BASE_SEPOLIA_USDC);
    console.log(
      `Deposit recorded: ${ethers.utils.formatUnits(depositInfo.assetAmount, decimals)} USDC`,
    );
    expect(depositInfo.assetAmount).toEqual(usdcDepositAmount);

    // Step 4: Withdraw from Aave (this will collect fees if there's any profit)
    console.log('\n📤 Step 4: Waiting 60 secs for profit to accrue, then withdrawing from Aave...');
    await new Promise((resolve) => setTimeout(resolve, 60000));
    console.log('✅ 60 secs passed, withdrawing from Aave...');

    // get aave balance so we know how much to withdraw
    // Query aToken balance for the test wallet (to know how much to withdraw)
    const aavePoolContract = new ethers.Contract(AAVE_POOL_ADDRESS, AAVE_POOL_ABI, testWallet);
    const aTokenAddress = await aavePoolContract.getReserveAToken(BASE_SEPOLIA_USDC);
    const aToken = new ethers.Contract(aTokenAddress, ERC20_ABI, testWallet);

    const userAaveTokens = await aToken.balanceOf(testWallet.address);
    console.log(
      'User has',
      ethers.utils.formatUnits(userAaveTokens, decimals),
      'aTokens after waiting for profit to accrue',
    );
    const approveATokenTx = await aToken.approve(FEE_DIAMOND_ADDRESS, userAaveTokens);
    await approveATokenTx.wait(TX_WAIT_CONFIRMATIONS);
    console.log('✅ Approved aTokens');

    const withdrawTx = await feeDiamond.withdrawFromAave(appId, BASE_SEPOLIA_USDC, userAaveTokens);
    await withdrawTx.wait(TX_WAIT_CONFIRMATIONS);
    console.log('✅ Withdrawn from Aave');

    // Check if any fees were collected
    const collectedFees = await feeDiamond.collectedAppFees(appId, BASE_SEPOLIA_USDC);
    console.log(`Collected app fees: ${ethers.utils.formatUnits(collectedFees, decimals)} USDC`);

    if (collectedFees.isZero()) {
      throw new Error('No fees collected');
    }

    // Step 5: Get session signatures for Lit Action
    console.log('\n🔐 Step 5: Getting session signatures...');
    const sessionSigs = await litNodeClient.getSessionSigs({
      chain: 'ethereum',
      resourceAbilityRequests: [
        { resource: new LitPKPResource('*'), ability: LIT_ABILITY.PKPSigning },
        { resource: new LitActionResource('*'), ability: LIT_ABILITY.LitActionExecution },
      ],
      authNeededCallback: async ({ resourceAbilityRequests, uri }) => {
        const [walletAddress, nonce] = await Promise.all([
          appOwnerWallet.getAddress(),
          litNodeClient.getLatestBlockhash(),
        ]);

        const toSign = await createSiweMessageWithRecaps({
          uri: uri || 'http://localhost:3000',
          expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
          resources: resourceAbilityRequests || [],
          walletAddress,
          nonce,
          litNodeClient,
        });

        return await generateAuthSig({ signer: appOwnerWallet, toSign });
      },
    });
    console.log('✅ Got session signatures');

    // Step 6: Sign owner attestation using Lit Action
    console.log('\n✍️  Step 6: Signing owner attestation using Lit Action...');
    const result = await signOwnerAttestation({
      litNodeClient,
      sessionSigs,
      appId,
      owner: appOwnerWallet.address,
      dstChainId: BASE_SEPOLIA_CHAIN_ID,
      dstContract: FEE_DIAMOND_ADDRESS,
      litActionIpfsCid: LIT_ACTION_IPFS_CID,
      srcChainId: CHRONICLE_YELLOWSTONE_CHAIN_ID,
      srcContract: VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
    });

    console.log('✅ Owner attestation signed');
    console.log(`Result: ${JSON.stringify(result, null, 2)}`);
    console.log('Signature:', result.signature);
    console.log('Attestation:', result.attestation);

    // Step 7: Withdraw app fees using the signed attestation
    console.log('\n💸 Step 7: Withdrawing app fees...');
    const appOwnerBaseSepoliaWallet = appOwnerWallet.connect(baseSepoliaProvider);
    const feeDiamondAsOwner = new ethers.Contract(
      FEE_DIAMOND_ADDRESS,
      FeeDiamondAbi,
      appOwnerBaseSepoliaWallet,
    );

    const balanceBefore = await usdc.balanceOf(appOwnerWallet.address);
    console.log(
      `App owner balance before: ${ethers.utils.formatUnits(balanceBefore, decimals)} USDC`,
    );

    const withdrawFeeTx = await feeDiamondAsOwner.withdrawAppFees(
      appId,
      BASE_SEPOLIA_USDC,
      result.attestation,
      result.signature,
    );
    await withdrawFeeTx.wait(TX_WAIT_CONFIRMATIONS);
    console.log('✅ Withdrawn app fees');

    // Step 8: Verify funds arrived
    console.log('\n✅ Step 8: Verifying funds arrived...');
    const balanceAfter = await usdc.balanceOf(appOwnerWallet.address);
    console.log(
      `App owner balance after: ${ethers.utils.formatUnits(balanceAfter, decimals)} USDC`,
    );

    const received = balanceAfter.sub(balanceBefore);
    console.log(`Received: ${ethers.utils.formatUnits(received, decimals)} USDC`);

    expect(received).toEqual(collectedFees);
    expect(received.gt(0)).toBe(true);

    // Verify fees were cleared
    const feesAfterWithdraw = await feeDiamond.collectedAppFees(appId, BASE_SEPOLIA_USDC);
    expect(feesAfterWithdraw).toEqual(ethers.BigNumber.from(0));

    // Step 9: Withdraw platform fees using Lit Foundation wallet
    console.log('\n💎 Step 9: Withdrawing platform fees...');
    const feeDiamondAsFoundation = new ethers.Contract(
      FEE_DIAMOND_ADDRESS,
      FeeDiamondAbi,
      litFoundationWallet,
    );

    // Check platform fees before withdrawal
    const platformFeesBefore = await feeDiamond.collectedAppFees(
      LIT_FOUNDATION_APP_ID,
      BASE_SEPOLIA_USDC,
    );
    expect(platformFeesBefore).not.toEqual(ethers.BigNumber.from(0));
    console.log(
      `Platform fees collected: ${ethers.utils.formatUnits(platformFeesBefore, decimals)} USDC`,
    );

    const foundationBalanceBefore = await usdc.balanceOf(litFoundationWallet.address);
    console.log(
      `Foundation balance before: ${ethers.utils.formatUnits(foundationBalanceBefore, decimals)} USDC`,
    );

    const withdrawPlatformFeeTx =
      await feeDiamondAsFoundation.withdrawPlatformFees(BASE_SEPOLIA_USDC);
    await withdrawPlatformFeeTx.wait(TX_WAIT_CONFIRMATIONS);
    console.log('✅ Withdrawn platform fees');

    // Verify platform fees arrived
    const foundationBalanceAfter = await usdc.balanceOf(litFoundationWallet.address);
    console.log(
      `Foundation balance after: ${ethers.utils.formatUnits(foundationBalanceAfter, decimals)} USDC`,
    );

    const receivedPlatformFees = foundationBalanceAfter.sub(foundationBalanceBefore);
    console.log(
      `Received platform fees: ${ethers.utils.formatUnits(receivedPlatformFees, decimals)} USDC`,
    );

    expect(receivedPlatformFees).toEqual(platformFeesBefore);
    expect(receivedPlatformFees.gt(0)).toBe(true);

    // Verify platform fees were cleared
    const platformFeesAfter = await feeDiamond.collectedAppFees(
      LIT_FOUNDATION_APP_ID,
      BASE_SEPOLIA_USDC,
    );
    expect(platformFeesAfter).toEqual(ethers.BigNumber.from(0));
    console.log('✅ Platform fees cleared from contract');

    console.log('\n🎉 E2E test completed successfully!');
  });
});
