import { LIT_NETWORKS_KEYS } from '@lit-protocol/types';
import { ethers } from 'ethers';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { DelegateeSigs } from '../pkp';
import { createPKPSigner, createPKPSignedJWT, verifyJWTSignature, createJWTConfig, decodeJWT, DecodedJWT } from '../auth';
import { Storage } from '../auth';

export interface VincentSDKConfig {
  consentPageUrl?: string;
  network?: LIT_NETWORKS_KEYS;
}

export class VincentSDK {
  private storage: Storage;
  private consentPageUrl: string;
  private network: LIT_NETWORKS_KEYS;

  constructor(config: VincentSDKConfig = {}) {
    this.storage = new Storage();
    this.consentPageUrl = config.consentPageUrl || 'https://demo.vincent.com';
    this.network = config.network || 'datil';
  }

  // JWT Management
  async createSigner(pkpWallet: PKPEthersWallet): Promise<any> {
    return createPKPSigner(pkpWallet);
  }

  async createSignedJWT(config: createJWTConfig): Promise<string> {
    this.clearJWT();
    const jwt = await createPKPSignedJWT(config);
    this.storeJWT(jwt);
    return jwt;
  }

  async decodeJWT(): Promise<DecodedJWT> {
    const jwt = await this.getJWT();
    if (!jwt) {
      throw new Error('No JWT found');
    }
    return decodeJWT(jwt);
  }

  async verifyJWT(expectedAudience: string): Promise<boolean> {
    const jwt = await this.getJWT();
    if (!jwt) {
      throw new Error('No JWT found');
    }
    return verifyJWTSignature(jwt, expectedAudience);
  }

  // Storage Management
  async storeJWT(jwt: string): Promise<void> {
    await this.storage.storeJWT(jwt);
  }

  async getJWT(): Promise<string | null> {
    return this.storage.getJWT();
  }

  async clearJWT(): Promise<void> {
    await this.storage.clearJWT();
  }

  async clearAll(): Promise<void> {
    await this.storage.clearAll();
  }

  // Lit Action Invocation for App Owner through Delegatee Wallet
  async invokeLitAction(signer: ethers.Signer, litActionCID: string, params: any) {
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
