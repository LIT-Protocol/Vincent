import { ethers } from 'ethers';
import { LIT_RPC } from '@lit-protocol/constants';

export const readOnlySigner = new ethers.Wallet(
  ethers.Wallet.createRandom().privateKey,
  new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE),
);
