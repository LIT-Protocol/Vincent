import {
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitActionResource,
} from '@lit-protocol/auth-helpers';
import { LIT_ABILITY, LIT_NETWORK, RPC_URL_BY_NETWORK } from '@lit-protocol/constants';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { ethers } from 'ethers';

import { checkMintLitCapacityCredit } from './check-mint-lit-capacity-credit';

export const executeVincentTool = async ({
  vincentToolIpfsCid,
  vincentToolParameters,
  vincentAppDelegateePrivateKey,
  litSdkDebug = false,
}: {
  vincentToolIpfsCid: string;
  vincentToolParameters: Record<string, unknown>;
  vincentAppDelegateePrivateKey: string;
  litSdkDebug?: boolean;
}) => {
  const delegateeWallet = new ethers.Wallet(
    vincentAppDelegateePrivateKey,
    new ethers.providers.JsonRpcProvider(RPC_URL_BY_NETWORK[LIT_NETWORK.Datil]),
  );

  let litNodeClient: LitNodeClient;

  try {
    litNodeClient = new LitNodeClient({
      litNetwork: LIT_NETWORK.Datil,
      debug: litSdkDebug,
    });
    await litNodeClient.connect();

    const litContractClient = new LitContracts({
      signer: delegateeWallet,
      network: LIT_NETWORK.Datil,
    });
    await litContractClient.connect();

    await checkMintLitCapacityCredit({
      creditOwnerEthersWallet: delegateeWallet,
    });

    const sessionSigs = await litNodeClient.getSessionSigs({
      chain: 'ethereum',
      expiration: new Date(Date.now() + 1000 * 60 * 15).toISOString(), // 15 minutes
      resourceAbilityRequests: [
        {
          resource: new LitActionResource('*'),
          ability: LIT_ABILITY.LitActionExecution,
        },
      ],
      authNeededCallback: async ({ resourceAbilityRequests, expiration, uri }) => {
        const toSign = await createSiweMessageWithRecaps({
          uri: uri!,
          expiration: expiration!,
          resources: resourceAbilityRequests!,
          walletAddress: delegateeWallet.address,
          nonce: await litNodeClient.getLatestBlockhash(),
          litNodeClient,
        });

        return await generateAuthSig({
          signer: delegateeWallet,
          toSign,
        });
      },
    });

    const litActionResponse = await litNodeClient.executeJs({
      sessionSigs,
      ipfsId: vincentToolIpfsCid,
      jsParams: {
        toolParams: {
          ...vincentToolParameters,
        },
      },
    });

    return litActionResponse;
  } catch (error) {
    console.error('Error executing tool:', error);
    throw error;
  } finally {
    litNodeClient!.disconnect();
  }
};
