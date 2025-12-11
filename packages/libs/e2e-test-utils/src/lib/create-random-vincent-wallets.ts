import { Wallet } from 'ethers';

export function createRandomVincentWallets() {
  return {
    appDelegatee: Wallet.createRandom(),
    appManager: Wallet.createRandom(),
    platformUserWalletOwner: Wallet.createRandom(),
  };
}
