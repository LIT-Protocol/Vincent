import { ethers } from 'ethers';
import { LIT_NETWORK, RPC_URL_BY_NETWORK } from '@lit-protocol/constants';

import {
  addVincentAppDelegatee,
  checkNativeTokenBalance,
  checkVincentApp,
  getEnv,
  checkToolExecutionAndGetPolicies,
} from '../helper-funcs';
import { getVincentAppInfoFromEnv } from './handle-vincent-app';
import { getPkpInfoFromEnv } from './handle-agent-wallet-pkp';

// TODO Handle delegatee permitted to another App
export const handleVincentAppDelegatees = async ({
  vincentAppDelegatees,
  vincentAppToolIpfsCids,
}: {
  vincentAppDelegatees: string[];
  vincentAppToolIpfsCids: string[];
}) => {
  await checkDelegateesNativeTokenBalances({
    delegateeAddresses: vincentAppDelegatees,
  });

  const { appId, appVersion } = await getVincentAppInfoFromEnv();
  if (appId === undefined || appVersion === undefined) {
    console.error(
      '❌ TEST_VINCENT_APP_ID and TEST_VINCENT_APP_VERSION environment variables are not set',
    );
    process.exit(1);
  }

  const { allDelegateesAvailable, missingDelegatees } = await checkVincentApp({
    appId,
    appVersion,
    vincentTools: [],
    vincentAppDelegatees,
  });

  if (!allDelegateesAvailable) {
    await addMissingDelegateesToVincentApp({
      appId,
      appVersion,
      missingDelegatees,
    });
  }

  await checkDelegateesArePermittedToExecuteTools({
    vincentAppDelegatees,
    vincentAppToolIpfsCids,
  });
};

const addMissingDelegateesToVincentApp = async ({
  appId,
  appVersion,
  missingDelegatees,
}: {
  appId: number;
  appVersion: number;
  missingDelegatees: string[];
}) => {
  console.error(
    `⚠️  Vincent App ID ${appId} and version ${appVersion} is missing the following delegatees: ${missingDelegatees.join(', ')}. Adding them...`,
  );

  const VINCENT_ADDRESS = getEnv('VINCENT_ADDRESS');
  if (VINCENT_ADDRESS === undefined) {
    console.error(
      '❌ VINCENT_ADDRESS environment variable is not set. Please set it to the address of the Vincent contract.',
    );
    process.exit(1);
  }

  const TEST_VINCENT_APP_MANAGER_PRIVATE_KEY = getEnv('TEST_VINCENT_APP_MANAGER_PRIVATE_KEY');
  if (TEST_VINCENT_APP_MANAGER_PRIVATE_KEY === undefined) {
    console.error(
      '❌ TEST_VINCENT_APP_MANAGER_PRIVATE_KEY environment variable is not set. Please set it to the private key that will be used to add the delegatee to the Vincent App.',
    );
    process.exit(1);
  }
  const vincentAppManagerEthersWallet = new ethers.Wallet(TEST_VINCENT_APP_MANAGER_PRIVATE_KEY);

  const MIN_ETH_BALANCE = ethers.utils.parseEther('0.01');
  const { balance, hasMinBalance } = await checkNativeTokenBalance({
    ethAddress: vincentAppManagerEthersWallet.address,
    rpcUrl: RPC_URL_BY_NETWORK[LIT_NETWORK.Datil],
    minBalance: MIN_ETH_BALANCE,
  });
  if (!hasMinBalance) {
    console.error(
      `❌ App Manager (${vincentAppManagerEthersWallet.address}) doesn't have the minimum required balance of ${ethers.utils.formatEther(MIN_ETH_BALANCE)} ETH on the Lit Datil network. Current balance is ${ethers.utils.formatEther(balance)} ETH. Please fund the App Manager before continuing using the Lit test token faucet: https://chronicle-yellowstone-faucet.getlit.dev/.`,
    );
    process.exit(1);
  }

  for (const delegatee of missingDelegatees) {
    const { delegateeAddress, txHash } = await addVincentAppDelegatee({
      vincentAddress: VINCENT_ADDRESS,
      vincentAppManagerEthersWallet,
      appId,
      delegateeAddress: delegatee,
    });
    console.log(`ℹ️  Added delegatee ${delegateeAddress} to app ${appId} with tx hash ${txHash}`);
  }
};

const checkDelegateesNativeTokenBalances = async ({
  delegateeAddresses,
}: {
  delegateeAddresses: string[];
}) => {
  const MIN_ETH_BALANCE = ethers.utils.parseEther('0.01');
  const insufficientBalanceDelegatees: { address: string; balance: ethers.BigNumber }[] = [];

  for (const delegateeAddress of delegateeAddresses) {
    const { balance, hasMinBalance } = await checkNativeTokenBalance({
      ethAddress: delegateeAddress,
      rpcUrl: RPC_URL_BY_NETWORK[LIT_NETWORK.Datil],
      minBalance: MIN_ETH_BALANCE,
    });

    if (!hasMinBalance) {
      insufficientBalanceDelegatees.push({
        address: delegateeAddress,
        balance,
      });
    }
  }

  if (insufficientBalanceDelegatees.length > 0) {
    console.error('❌ The following delegatees have insufficient balances:');
    insufficientBalanceDelegatees.forEach(({ address, balance }) => {
      console.error(
        `  - ${address}: ${ethers.utils.formatEther(balance)} Lit test token (minimum required: ${ethers.utils.formatEther(MIN_ETH_BALANCE)})`,
      );
    });
    console.error(
      'Please fund these addresses using the Lit test token faucet: https://chronicle-yellowstone-faucet.getlit.dev/',
    );
    process.exit(1);
  }
};

const checkDelegateesArePermittedToExecuteTools = async ({
  vincentAppDelegatees,
  vincentAppToolIpfsCids,
}: {
  vincentAppDelegatees: string[];
  vincentAppToolIpfsCids: string[];
}) => {
  const VINCENT_ADDRESS = getEnv('VINCENT_ADDRESS');
  if (VINCENT_ADDRESS === undefined) {
    console.error(
      `❌ VINCENT_ADDRESS environment variable is not set. Please set it to the address of the Vincent contract.`,
    );
    process.exit(1);
  }

  const pkpInfo = await getPkpInfoFromEnv();
  if (pkpInfo === null) {
    console.error(
      '❌ No Agent Wallet PKP identifier found in environment variables. Please set one of the following: TEST_VINCENT_AGENT_WALLET_PKP_ETH_ADDRESS, TEST_VINCENT_AGENT_WALLET_PKP_TOKEN_ID, TEST_VINCENT_AGENT_WALLET_PKP_PUBLIC_KEY',
    );
    process.exit(1);
  }

  const unpermittedCombinations: { delegateeAddress: string; toolIpfsCid: string }[] = [];
  for (const toolIpfsCid of vincentAppToolIpfsCids) {
    for (const delegateeAddress of vincentAppDelegatees) {
      const { delegateeIsPermitted } = await checkToolExecutionAndGetPolicies({
        vincentContractAddress: VINCENT_ADDRESS,
        delegateeAddress,
        pkpTokenId: ethers.BigNumber.from(pkpInfo.tokenId),
        toolIpfsCid,
      });

      if (!delegateeIsPermitted) {
        unpermittedCombinations.push({
          delegateeAddress,
          toolIpfsCid,
        });
      }
    }
  }

  if (unpermittedCombinations.length > 0) {
    console.error(
      `❌ The following Vincent App Delegatees are not permitted to execute the following Vincent Tools with Agent Wallet PKP token id ${pkpInfo.tokenId}:`,
    );
    unpermittedCombinations.forEach(({ delegateeAddress, toolIpfsCid }) => {
      console.error(`  - Delegatee ${delegateeAddress} cannot execute tool ${toolIpfsCid}`);
    });
    process.exit(1);
  }

  console.log(
    `ℹ️  All delegatees have permission to execute all tools with PKP token id ${pkpInfo.tokenId}`,
  );
};
