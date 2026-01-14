import { ethers } from 'ethers';

type AccountManagerOptions = {
  provider: ethers.providers.JsonRpcProvider;
  appManagerPrivateKey: string;
  userPrivateKey: string;
  funderPrivateKey?: string;
};

/**
 * Creates signer instances from test private keys so that key handling stays centralized.
 */
export const createAccountManager = ({
  provider,
  appManagerPrivateKey,
  userPrivateKey,
  funderPrivateKey,
}: AccountManagerOptions) => {
  const appManagerSigner = new ethers.Wallet(appManagerPrivateKey, provider);
  const userSigner = new ethers.Wallet(userPrivateKey, provider);
  const funderSigner = funderPrivateKey ? new ethers.Wallet(funderPrivateKey, provider) : undefined;

  return {
    appManagerSigner,
    userSigner,
    funderSigner,
  };
};
