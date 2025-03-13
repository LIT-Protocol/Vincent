export interface VincentApp {
    appId: number;
    appName: string;
    description: string;
    authorizedDomains: string[];
    authorizedRedirectUris: string[];
    delegatees: string[];
    toolPolicies: ToolPolicy[];
    managementWallet: string;
    isEnabled: boolean;
    appMetadata?: AppMetadata; // off-chain
}

export interface AppMetadata {
    email: string;
}

export interface ToolPolicy {
    description: string;
    toolIpfsCid: string;
    policyVarsSchema: PolicyParamSchema[];
}

export interface PolicyParamSchema {
    paramName: string;
    valueType: string;
    defaultValue: any;
}

export interface Tool {
    toolId: string;
    ipfsCid: string;
    name: string;
    description: string;
}