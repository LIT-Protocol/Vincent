export interface VincentApp {
    appCreator: string;
    appMetadata: AppMetadata;
    roles: Role[];
    delegatees: string[];
}

export interface Role {
    roleId: string;
    roleName: string;
    roleDescription: string;
    toolPolicy: ToolPolicy[];
}

export interface AppMetadata {
    appName: string;
    description: string;
    email: string;
}

export interface ToolPolicy {
    description: any;
    toolIpfsCid: any;
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
}

export interface Policy {
    policyId: string;
    ipfsCid: string;
    schema: PolicyParamSchema[];
}

export interface RegisterAppRequest {
    signedMessage: string;
    appName: string;
    appDescription: string;
    logo?: string;
    email: string;
    domain?: string;
}

export interface UpdateRoleRequest {
    signedMessage: string;
    appId: string;
    roleId: string;
    roleVersion: string;
    roleName: string;
    roleDescription: string;
    toolPolicy: {
        tool: Tool;
        policy: Policy;
    }[];
}

export interface RoleResponse {
    roleId: string;
    roleVersion: string;
    toolPolicy: {
        tool: Tool;
        policy: Policy;
    }[];
}
