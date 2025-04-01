import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { LIT_NETWORK } from '@lit-protocol/constants';
import { LIT_NETWORKS_KEYS } from '@lit-protocol/types';
import { ethers } from 'ethers';
import {
  createJWTConfig,
  createPKPSignedJWT,
  createPKPSigner,
  decodeJWT,
  verifyJWTSignature,
} from '../auth';
import { DelegateeSigs } from '../pkp';

export interface VincentSDKConfig {
  consentPageUrl?: string;
}

export class VincentSDK {
  private readonly consentPageUrl: string;
  private readonly network: LIT_NETWORKS_KEYS;

  constructor(config: VincentSDKConfig = {}) {
    this.consentPageUrl = config.consentPageUrl || 'https://dashboard.heyvincent.ai/';
    this.network = LIT_NETWORK.Datil;
  }

  // JWT Management
  async createSigner(
    pkpWallet: PKPEthersWallet
  ): Promise<(data: string | Uint8Array) => Promise<string>> {
    return createPKPSigner(pkpWallet);
  }

  async createSignedJWT(config: createJWTConfig): Promise<string> {
    return createPKPSignedJWT(config);
  }

  decodeJWT(jwt: string) {
    return decodeJWT(jwt);
  }

  verifyJWT(jwt: string, expectedAudience: string) {
    return verifyJWTSignature(jwt, expectedAudience);
  }

  // Lit Action Invocation for App Owner through Delegatee Wallet
  async executeTool(
    signer: ethers.Signer,
    vincentToolCID: string,
    params: Record<string, unknown>
  ) {
    const sessionSigs = new DelegateeSigs(this.network);
    return sessionSigs.invokeLitAction(signer, vincentToolCID, params);
  }

  // Redirect user to Vincent Auth consent page to get a jwt
  redirectConsentPage(appId: string, redirectUri: string): void {
    const url = new URL(`/appId/${appId}/consent?redirectUri=${redirectUri}`, this.consentPageUrl);
    window.open(url.toString(), '_self');
  }
}
