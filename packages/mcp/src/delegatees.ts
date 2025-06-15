import { LIT_EVM_CHAINS } from '@lit-protocol/constants';
import { ethers } from 'ethers';

export function getVincentDelegateeSigner(delegateePrivateKey: string) {
  const delegateeSigner = new ethers.Wallet(
    delegateePrivateKey,
    new ethers.providers.StaticJsonRpcProvider(LIT_EVM_CHAINS.yellowstone.rpcUrls[0]),
  );

  return delegateeSigner;
}
