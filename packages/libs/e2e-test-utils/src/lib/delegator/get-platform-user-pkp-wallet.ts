import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import type { SessionSigs, LIT_NETWORKS_KEYS } from '@lit-protocol/types';
import { AUTH_METHOD_TYPE, LIT_NETWORK } from '@lit-protocol/constants';
import { LitActionResource, LitPKPResource } from '@lit-protocol/auth-helpers';
import { LIT_ABILITY } from '@lit-protocol/constants';
import { LitNodeClient } from '@lit-protocol/lit-node-client';

import type { PkpInfo } from './mint-new-pkp';
import { getChainHelpers } from './chain';
import { getLitContractsClient } from './litContractsClient/get-lit-contract-client';

const SELECTED_LIT_NETWORK = LIT_NETWORK.Datil as LIT_NETWORKS_KEYS;

let litNodeClient: LitNodeClient | null = null;

const getLitNodeClient = async (): Promise<LitNodeClient> => {
  if (litNodeClient) {
    return litNodeClient;
  }

  litNodeClient = new LitNodeClient({
    alertWhenUnauthorized: false,
    litNetwork: SELECTED_LIT_NETWORK,
    debug: false,
  });

  await litNodeClient.connect();

  return litNodeClient;
};

/**
 * Get session signatures for a PKP using the EOA owner's wallet as the auth method
 */
export const getPlatformUserPkpSessionSigs = async (
  platformUserPkpInfo: PkpInfo,
): Promise<SessionSigs> => {
  const {
    wallets: { platformUserWalletOwner },
  } = await getChainHelpers();

  const client = await getLitNodeClient();
  const litContractClient = await getLitContractsClient({ wallet: platformUserWalletOwner });

  // Get the PKP's public key
  const publicKey = await litContractClient.pkpNftContract.read.getPubkey(
    platformUserPkpInfo.tokenId,
  );

  console.log(
    `Getting session signatures for Platform User PKP ${platformUserPkpInfo.ethAddress}...`,
  );

  const sessionSigs = await client.getPkpSessionSigs({
    chain: 'ethereum',
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 1).toISOString(), // 1 hour
    pkpPublicKey: publicKey,
    authMethods: [
      {
        authMethodType: AUTH_METHOD_TYPE.EthWallet,
        accessToken: platformUserWalletOwner.address,
      },
    ],
    resourceAbilityRequests: [
      {
        resource: new LitActionResource('*'),
        ability: LIT_ABILITY.LitActionExecution,
      },
      {
        resource: new LitPKPResource('*'),
        ability: LIT_ABILITY.PKPSigning,
      },
    ],
  });

  return sessionSigs;
};

/**
 * Get a PKPEthersWallet instance for the Platform User PKP
 * This wallet can be used to sign transactions and mint new PKPs on behalf of the Platform User PKP
 */
export const getPlatformUserPkpWallet = async (
  platformUserPkpInfo: PkpInfo,
): Promise<PKPEthersWallet> => {
  const {
    wallets: { platformUserWalletOwner },
  } = await getChainHelpers();

  const litContractClient = await getLitContractsClient({ wallet: platformUserWalletOwner });
  const client = await getLitNodeClient();

  // Get the PKP's public key
  const publicKey = await litContractClient.pkpNftContract.read.getPubkey(
    platformUserPkpInfo.tokenId,
  );

  console.log(
    `Creating PKP Ethers Wallet for Platform User PKP ${platformUserPkpInfo.ethAddress}...`,
  );

  // Get session signatures
  const sessionSigs = await getPlatformUserPkpSessionSigs(platformUserPkpInfo);

  // Create PKP Ethers Wallet
  const pkpWallet = new PKPEthersWallet({
    pkpPubKey: publicKey,
    litNodeClient: client,
    controllerSessionSigs: sessionSigs,
  });

  await pkpWallet.init();

  console.log(
    `✓ PKP Ethers Wallet initialized for Platform User PKP ${platformUserPkpInfo.ethAddress}`,
  );

  return pkpWallet;
};
