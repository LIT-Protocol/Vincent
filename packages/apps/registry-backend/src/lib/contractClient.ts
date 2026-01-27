import { providers, Wallet } from 'ethers';

import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import { env } from '../env';

// Use Vincent Registry RPC URL to connect to the chain where the Vincent Diamond contract is deployed
const getVincentRegistryProvider = () =>
  new providers.JsonRpcProvider(env.VINCENT_REGISTRY_RPC_URL);

// Random wallet is fine since this is only used for read operations
const ethersSigner = Wallet.createRandom().connect(getVincentRegistryProvider());

export const getContractClient = () => {
  return getClient({
    signer: ethersSigner,
  });
};
