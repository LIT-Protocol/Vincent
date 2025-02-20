export interface VincentApp {
    appCreator: string;
    appMetadata: AppMetadata;
    roles: Role[];
    delegatees: string[];
    enabled: boolean;
}

export interface Role {
    roleId: string;
    roleName: string;
    roleDescription: string;
    toolPolicy: ToolPolicy[];
    roleVersion: string;
    enabled: boolean;
}

export interface AppMetadata {
    appId: string;
    appName: string;
    description: string;
    email: string;
    domain?: string;
}

export interface ToolPolicy {
    toolCId: string;
    policyCId: string;
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

export interface PolicyParamSchema {
    paramId: string;
    paramName: string;
    type: string;
    defaultValue: any;
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
