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
  network?: LIT_NETWORKS_KEYS;
}

export class VincentSDK {
  private readonly consentPageUrl: string;
  private readonly network: LIT_NETWORKS_KEYS;

  constructor(config: VincentSDKConfig = {}) {
    this.consentPageUrl = config.consentPageUrl || 'https://demo.vincent.com';
    this.network = config.network || LIT_NETWORK.Datil;
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
  async invokeLitAction(
    signer: ethers.Signer,
    litActionCID: string,
    params: Record<string, unknown>
  ) {
    const sessionSigs = new DelegateeSigs(this.network);
    return sessionSigs.invokeLitAction(signer, litActionCID, params);
  }

  // Consent Page Management
  openSignInConsentPage(): void {
    const url = new URL('/signin', this.consentPageUrl);
    window.open(url.toString(), '_blank');
  }

  openDelegationControlConsentPage(): void {
    const url = new URL('/delegate', this.consentPageUrl);
    window.open(url.toString(), '_blank');
  }
}
