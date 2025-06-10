import { ethers } from 'ethers';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_NETWORK, LIT_ABILITY } from '@lit-protocol/constants';
import {
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitActionResource,
} from '@lit-protocol/auth-helpers';
import { LitContracts } from '@lit-protocol/contracts-sdk';

const YELLOWSTONE_RPC_URL = 'https://yellowstone-rpc.litprotocol.com/';

export interface ExecuteToolOptions {
  toolIpfsCid: string;
  toolParameters: any;
  delegateePrivateKey: string;
  litNetwork?: string;
  sessionDurationMinutes?: number;
  debug?: boolean;
  capacityCreditTokenId: string;
}

export const executeTool = async (options: ExecuteToolOptions) => {
  const {
    toolIpfsCid,
    toolParameters,
    delegateePrivateKey,
    sessionDurationMinutes = 10,
    debug = false,
  } = options;

  const delegateeWallet = new ethers.Wallet(
    delegateePrivateKey,
    new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL),
  );

  let litNodeClient: LitNodeClient;

  try {
    litNodeClient = new LitNodeClient({
      litNetwork: LIT_NETWORK.Datil,
      debug,
    });
    await litNodeClient.connect();

    const litContractClient = new LitContracts({
      signer: delegateeWallet,
      network: LIT_NETWORK.Datil,
    });
    await litContractClient.connect();

    const { capacityDelegationAuthSig } = await litNodeClient.createCapacityDelegationAuthSig({
      dAppOwnerWallet: delegateeWallet,
      capacityTokenId: options.capacityCreditTokenId,
      uses: '1',
      expiration: new Date(Date.now() + 1000 * 60 * sessionDurationMinutes).toISOString(),
    });

    const sessionSigs = await litNodeClient.getSessionSigs({
      chain: 'ethereum',
      expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
      capabilityAuthSigs: [capacityDelegationAuthSig],
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
      ipfsId: toolIpfsCid,
      jsParams: {
        toolParams: {
          ...toolParameters,
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
