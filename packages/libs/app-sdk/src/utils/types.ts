import type { Signer } from 'ethers';

/**
 * @inline
 * @expand
 */
export interface GetDelegatorsAgentPkpsParams {
  appId: number;
  appVersion: number;
  signer: Signer;
  offset: number;
}
