import { providers, Wallet } from 'ethers';

import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import { env } from '../env';

// Use BASE_RPC_URL which should point to Base mainnet or Base Sepolia depending on environment
const getBaseProvider = () => new providers.JsonRpcProvider(env.BASE_RPC_URL);

// Random wallet is fine since this is only used for read operations
const ethersSigner = Wallet.createRandom().connect(getBaseProvider());

export const getContractClient = () => {
  return getClient({
    signer: ethersSigner,
  });
};
