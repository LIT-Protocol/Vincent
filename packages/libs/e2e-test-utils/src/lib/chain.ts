import { ethers, Wallet } from 'ethers';

import { getEnv } from './env';

let ethersHelpers: {
  providers: {
    yellowstone: ethers.providers.JsonRpcProvider;
    base: ethers.providers.JsonRpcProvider;
  };
  wallets: {
    appDelegatee: Wallet;
    funder: Wallet;
    appManager: Wallet;
    agentWalletOwner: Wallet;
  };
};

// Vincent delegation uses a set of wallets that interact with LIT's test network: Yellowstone RPC
// This function constructs Ethers Wallet objects configured using the appropriate environment variables
// It also provides the low-level providers for `yellowstone` and `base` networks for doing things like checking account balances
export const getChainHelpers = async () => {
  if (ethersHelpers) {
    return ethersHelpers;
  }

  const {
    YELLOWSTONE_RPC_URL,
    BASE_RPC_URL,
    TEST_FUNDER_PRIVATE_KEY,
    TEST_APP_MANAGER_PRIVATE_KEY,
    TEST_APP_DELEGATEE_PRIVATE_KEY,
    TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY,
  } = getEnv();

  const yellowstoneProvider = new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL);
  const baseProvider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);

  ethersHelpers = {
    providers: {
      yellowstone: yellowstoneProvider,
      base: baseProvider,
    },
    wallets: {
      appDelegatee: new Wallet(TEST_APP_DELEGATEE_PRIVATE_KEY, yellowstoneProvider),
      funder: new Wallet(TEST_FUNDER_PRIVATE_KEY, yellowstoneProvider),
      appManager: new Wallet(TEST_APP_MANAGER_PRIVATE_KEY, yellowstoneProvider),
      agentWalletOwner: new Wallet(TEST_AGENT_WALLET_PKP_OWNER_PRIVATE_KEY, yellowstoneProvider),
    },
  };

  return ethersHelpers;
};
