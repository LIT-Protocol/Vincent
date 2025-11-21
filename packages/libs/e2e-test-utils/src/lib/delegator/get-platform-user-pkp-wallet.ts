import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import type { LIT_NETWORKS_KEYS } from '@lit-protocol/types';
import { LIT_NETWORK, LIT_ABILITY } from '@lit-protocol/constants';
import {
  LitActionResource,
  LitPKPResource,
  createSiweMessageWithRecaps,
  generateAuthSig,
} from '@lit-protocol/auth-helpers';
import { LitNodeClient } from '@lit-protocol/lit-node-client';

import type { PkpInfo } from '../mint-new-pkp';
import { getChainHelpers } from '../chain';
import { getLitContractsClient } from '../litContractsClient/get-lit-contract-client';

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
  await litContractClient.connect();

  const client = await getLitNodeClient();

  // Get the PKP's public key
  const publicKey = await litContractClient.pkpNftContract.read.getPubkey(
    platformUserPkpInfo.tokenId,
  );

  console.log(
    `Creating PKP Ethers Wallet for Platform User PKP ${platformUserPkpInfo.ethAddress}...`,
  );

  // Get session signatures for controlling the PKP
  // The EOA wallet owner signs to prove it has authority to use the PKP
  const sessionSigs = await client.getSessionSigs({
    chain: 'ethereum',
    resourceAbilityRequests: [
      {
        resource: new LitPKPResource('*'),
        ability: LIT_ABILITY.PKPSigning,
      },
      {
        resource: new LitActionResource('*'),
        ability: LIT_ABILITY.LitActionExecution,
      },
    ],
    authNeededCallback: async ({ resourceAbilityRequests, uri }) => {
      const [walletAddress, nonce] = await Promise.all([
        platformUserWalletOwner.getAddress(),
        client.getLatestBlockhash(),
      ]);

      const toSign = await createSiweMessageWithRecaps({
        uri: uri || 'http://localhost:3000',
        expiration: new Date(Date.now() + 1000 * 60 * 60 * 1).toISOString(), // 1 hour
        resources: resourceAbilityRequests || [],
        walletAddress,
        nonce,
        litNodeClient: client,
      });

      return await generateAuthSig({ signer: platformUserWalletOwner, toSign });
    },
  });

  // Create PKP Ethers Wallet with RPC provider for proper gas estimation
  const pkpWallet = new PKPEthersWallet({
    litNodeClient: client,
    pkpPubKey: publicKey,
    controllerSessionSigs: sessionSigs,
  });

  await pkpWallet.init();

  console.log(
    `PKP Ethers Wallet initialized for Platform User PKP ${await pkpWallet.getAddress()}`,
  );

  return pkpWallet;
};
