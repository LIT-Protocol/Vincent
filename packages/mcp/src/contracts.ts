import { LIT_NETWORK, LIT_RPC } from '@lit-protocol/constants';
import { ethers } from 'ethers';

import APP_VIEW_FACET_ABI from './abis/VincentAppViewFacet.abi.json';
import { env } from './env';

export const rpc = LIT_RPC.CHRONICLE_YELLOWSTONE;
export type Network = typeof LIT_NETWORK.Datil;
export type ContractFacet = 'AppView';

const { VINCENT_DATIL_CONTRACT } = env;

export const VINCENT_DIAMOND_ADDRESS: Record<Network, string> = {
  datil: VINCENT_DATIL_CONTRACT,
};

export const FACET_ABIS = {
  AppView: APP_VIEW_FACET_ABI,
};

/**
 * Get a contract instance for a specific facet of the Vincent Diamond
 * @param network The network to connect to
 * @param facet The contract facet to use
 * @returns A contract instance for the specified facet
 */
export async function getContract(network: Network, facet: ContractFacet) {
  const abi = FACET_ABIS[facet];

  const provider = new ethers.providers.JsonRpcProvider(rpc);
  return new ethers.Contract(VINCENT_DIAMOND_ADDRESS[network], abi, provider);
}

export async function fetchDelegatedAgentPKPTokenIds(appId: number, version: number) {
  const contract = await getContract(LIT_NETWORK.Datil, 'AppView');
  const appView = await contract.getAppVersion(appId, version);
  return appView.appVersion.delegatedAgentPkpTokenIds as ethers.BigNumber[];
}
