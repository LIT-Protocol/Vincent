import { ethers } from 'ethers';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import {
  LitActionResource,
  LitPKPResource,
  createSiweMessageWithRecaps,
  generateAuthSig,
} from '@lit-protocol/auth-helpers';
import { LIT_ABILITY } from '@lit-protocol/constants';
import { LIT_NETWORKS_KEYS } from '@lit-protocol/types';

export class DelegateeSigs {
  private readonly litNodeClient: LitNodeClient;

  constructor(litNetwork: LIT_NETWORKS_KEYS) {
    this.litNodeClient = new LitNodeClient({
      litNetwork: litNetwork,
    });
  }

  private async generateSessionSigs(signer: ethers.Signer) {
    if (!this.litNodeClient.ready) {
      await this.litNodeClient.connect();
    }

    const sessionSigs = await this.litNodeClient.getSessionSigs({
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
          signer.getAddress(),
          this.litNodeClient.getLatestBlockhash(),
        ]);

        const toSign = await createSiweMessageWithRecaps({
          uri: uri || 'http://localhost:3000',
          expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes,
          resources: resourceAbilityRequests || [],
          walletAddress,
          nonce,
          litNodeClient: this.litNodeClient,
        });

        return await generateAuthSig({
          signer: signer,
          toSign,
        });
      },
    });

    return sessionSigs;
  }

  async invokeLitAction(
    signer: ethers.Signer,
    litActionCID: string,
    params: Record<string, unknown>
  ) {
    const sessionSigs = await this.generateSessionSigs(signer);

    const results = await this.litNodeClient.executeJs({
      ipfsId: litActionCID,
      sessionSigs: sessionSigs,
      jsParams: params,
    });

    return results;
  }
}
