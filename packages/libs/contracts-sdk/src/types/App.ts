import type { Signer, Overrides } from 'ethers';

// ==================================================================================
// App Mutation Types
// ==================================================================================

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface AppVersionTools {
  toolIpfsCids: string[];
  toolPolicies: string[][];
}

/** @category Interfaces
 * @inline
 * @expand
 * */
export interface RegisterAppParams {
  appId: number;
  delegateeAddresses: string[];
  versionTools: AppVersionTools;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface RegisterNextVersionParams {
  appId: number;
  versionTools: AppVersionTools;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface RegisterAppOptions {
  signer: Signer;
  args: RegisterAppParams;
  overrides?: Overrides;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface RegisterNextVersionOptions {
  signer: Signer;
  args: RegisterNextVersionParams;
  overrides?: Overrides;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface EnableAppVersionParams {
  appId: number;
  appVersion: number;
  enabled: boolean;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface AddDelegateeParams {
  appId: number;
  delegateeAddress: string;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface RemoveDelegateeParams {
  appId: number;
  delegateeAddress: string;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface DeleteAppParams {
  appId: number;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface UndeleteAppParams {
  appId: number;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface EnableAppVersionOptions {
  signer: Signer;
  args: EnableAppVersionParams;
  overrides?: Overrides;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface AddDelegateeOptions {
  signer: Signer;
  args: AddDelegateeParams;
  overrides?: Overrides;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface RemoveDelegateeOptions {
  signer: Signer;
  args: RemoveDelegateeParams;
  overrides?: Overrides;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface DeleteAppOptions {
  signer: Signer;
  args: DeleteAppParams;
  overrides?: Overrides;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface UndeleteAppOptions {
  signer: Signer;
  args: UndeleteAppParams;
  overrides?: Overrides;
}

// ==================================================================================
// App View Types
// ==================================================================================

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAppByIdParams {
  appId: number;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAppByIdOptions {
  signer: Signer;
  args: GetAppByIdParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface App {
  id: number;
  isDeleted: boolean;
  manager: string;
  latestVersion: number;
  delegateeAddresses: string[];
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAppVersionParams {
  appId: number;
  version: number;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAppVersionOptions {
  signer: Signer;
  args: GetAppVersionParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface Tool {
  toolIpfsCid: string;
  policyIpfsCids: string[];
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface AppVersion {
  version: number;
  enabled: boolean;
  tools: Tool[];
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAppsByManagerParams {
  managerAddress: string;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAppsByManagerOptions {
  signer: Signer;
  args: GetAppsByManagerParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface AppWithVersions {
  app: App;
  versions: AppVersion[];
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAppByDelegateeParams {
  delegateeAddress: string;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAppByDelegateeOptions {
  signer: Signer;
  args: GetAppByDelegateeParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetDelegatedPkpEthAddressesParams {
  appId: number;
  version: number;
  pageOpts?: {
    offset?: number;
    limit?: number;
  };
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetDelegatedPkpEthAddressesOptions {
  signer: Signer;
  args: GetDelegatedPkpEthAddressesParams;
}
