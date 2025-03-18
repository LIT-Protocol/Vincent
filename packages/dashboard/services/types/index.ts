export interface VincentApp {
  appId: number;
  appName: string;
  description: string;
  managementWallet: string;
  currentVersion: number;
  delegatees: string[];
  authorizedDomains: string[];
  authorizedRedirectUris: string[];
  isEnabled: boolean;
  toolPolicies: ToolPolicy[];
  delegatedAgentPKPs: string[];
  appMetadata?: AppMetadata; // off-chain
  versions: {
    version: number;
    enabled: boolean;
    toolPolicies: ToolPolicy[];
    delegatedAgentPKPs: string[];
  }[];
}

export interface AppMetadata {
  email: string;
}

export interface ToolPolicy {
  toolIpfsCid: string;
  policies: Policy[];
}

export interface Policy {
  policyIpfsCid: string;
  policySchemaIpfsCid: string;
  parameterNames: string[];
}
