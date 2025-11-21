import type { ethers } from 'ethers';

import type { LitContracts } from '@lit-protocol/contracts-sdk';
import type { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

import { LitContractsInstance } from './LitContractsInstance';

const instancesByWallet = new WeakMap<ethers.Wallet | PKPEthersWallet, LitContractsInstance>();

export async function getLitContractsClient({
  wallet,
}: {
  wallet: ethers.Wallet | PKPEthersWallet;
}): Promise<LitContracts> {
  let instance = instancesByWallet.get(wallet);
  if (instance) {
    // connect() is idempotent; if we're retrying from outside, attempt to connect again
    // This is a no-op if already connected 🎉 but if a prior attempt fails, it'll try again.
    await instance.connect();
    return instance.litContracts;
  }

  instance = new LitContractsInstance({ wallet });
  instancesByWallet.set(wallet, instance);
  await instance.connect();

  return instance.litContracts;
}
