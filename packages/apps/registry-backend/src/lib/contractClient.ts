import { ethers, providers } from 'ethers';

import { getClient } from '@lit-protocol/vincent-contracts-sdk';

export const ethersSigner = ethers.Wallet.createRandom().connect(
  new providers.JsonRpcProvider('https://yellowstone-rpc.litprotocol.com'),
);

export const getContractClient = () => {
  return getClient({
    signer: ethersSigner,
  });
};
