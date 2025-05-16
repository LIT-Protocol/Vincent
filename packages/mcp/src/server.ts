import { LIT_EVM_CHAINS } from '@lit-protocol/constants';
import { mcp } from '@lit-protocol/vincent-sdk';
import { ethers } from 'ethers';

import { env } from './env';
import { extendVincentServer } from './extensions';

const { VINCENT_DELEGATEE_PRIVATE_KEY } = env;
const { getVincentAppServer } = mcp;

export function getServer(vincentAppDef: mcp.VincentAppDef) {
  const delegateeSigner = new ethers.Wallet(
    VINCENT_DELEGATEE_PRIVATE_KEY,
    new ethers.providers.StaticJsonRpcProvider(LIT_EVM_CHAINS.yellowstone.rpcUrls[0]),
  );

  const server = getVincentAppServer(delegateeSigner, vincentAppDef);
  extendVincentServer(server, vincentAppDef, delegateeSigner);

  return server;
}
