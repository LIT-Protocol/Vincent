// src/lib/toolClient/types.ts

import { ethers } from 'ethers';
import { ExecuteJsResponse } from '@lit-protocol/types';

/**
 * @inline
 * @hidden
 * */
export type VincentToolParams = Record<string, unknown>;

/** @inline
 * @hidden
 * */
export interface VincentToolClientConfig {
  ethersSigner: ethers.Signer;
  vincentToolCid: string;
}

/**
 * The Vincent Tool Client uses an ethers signer for your delegatee account to run Vincent Tools
 * on behalf of your app users.
 *
 * The {@link VincentToolClient} will typically be used by an AI agent or your app backend service, as it
 * requires a signer that conforms to the ethers v5 signer API, and with access to your delegatee account's
 * private key to authenticate with the LIT network when executing the Vincent Tool
 *
 * @category Vincent Tools
 */
export interface VincentToolClient {
  execute: (params: VincentToolParams) => Promise<ExecuteJsResponse>;
}
