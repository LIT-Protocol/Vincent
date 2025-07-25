import { Signer } from 'ethers';

// ==================================================================================
// App Mutation Types
// ==================================================================================

export interface AppVersionTools {
  toolIpfsCids: string[];
  toolPolicies: string[][];
}

export interface RegisterAppParams {
  appId: string;
  delegatees: string[];
  versionTools: AppVersionTools;
}

export interface RegisterNextVersionParams {
  appId: string;
  versionTools: AppVersionTools;
}

export interface RegisterAppOptions {
  signer: Signer;
  args: RegisterAppParams;
  overrides?: any;
}

export interface RegisterNextVersionOptions {
  signer: Signer;
  args: RegisterNextVersionParams;
  overrides?: any;
}
export interface EnableAppVersionParams {
  appId: string;
  appVersion: string;
  enabled: boolean;
}

export interface AddDelegateeParams {
  appId: string;
  delegatee: string;
}

export interface RemoveDelegateeParams {
  appId: string;
  delegatee: string;
}

export interface DeleteAppParams {
  appId: string;
}

export interface UndeleteAppParams {
  appId: string;
}

export interface EnableAppVersionOptions {
  signer: Signer;
  args: EnableAppVersionParams;
  overrides?: any;
}

export interface AddDelegateeOptions {
  signer: Signer;
  args: AddDelegateeParams;
  overrides?: any;
}

export interface RemoveDelegateeOptions {
  signer: Signer;
  args: RemoveDelegateeParams;
  overrides?: any;
}

export interface DeleteAppOptions {
  signer: Signer;
  args: DeleteAppParams;
  overrides?: any;
}

export interface UndeleteAppOptions {
  signer: Signer;
  args: UndeleteAppParams;
  overrides?: any;
}

// ==================================================================================
// App View Types
// ==================================================================================

export interface GetAppByIdParams {
  appId: string;
}

export interface GetAppByIdOptions {
  signer: Signer;
  args: GetAppByIdParams;
}

export interface App {
  id: string;
  isDeleted: boolean;
  manager: string;
  latestVersion: string;
  delegatees: string[];
}

export interface GetAppVersionParams {
  appId: string;
  version: string;
}

export interface GetAppVersionOptions {
  signer: Signer;
  args: GetAppVersionParams;
}

export interface Tool {
  toolIpfsCid: string;
  policyIpfsCids: string[];
}

export interface AppVersion {
  version: string;
  enabled: boolean;
  delegatedAgentPkpTokenIds: string[];
  tools: Tool[];
}

export interface GetAppsByManagerParams {
  manager: string;
  offset: string;
  limit: string;
}

export interface GetAppsByManagerOptions {
  signer: Signer;
  args: GetAppsByManagerParams;
}

export interface AppWithVersions {
  app: App;
  versions: AppVersion[];
}

export interface GetAppByDelegateeParams {
  delegatee: string;
}

export interface GetAppByDelegateeOptions {
  signer: Signer;
  args: GetAppByDelegateeParams;
}

export interface GetDelegatedAgentPkpTokenIdsParams {
  appId: string;
  version: string;
  offset: string;
}

export interface GetDelegatedAgentPkpTokenIdsOptions {
  signer: Signer;
  args: GetDelegatedAgentPkpTokenIdsParams;
}
