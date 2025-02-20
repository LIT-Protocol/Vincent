import { VincentApp } from "@/types";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_BE_BASE_URL || "http://localhost:3000/api/v1";

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Register new app
export async function registerApp(params: {
    signedMessage: string;
    appName: string;
    appDescription: string;
    email: string;
    domain?: string;
}): Promise<ApiResponse<{ appId: string; appName: string; logo?: string }>> {
    // For now return mock data
    return {
        success: true,
        data: {
            appId: "1",
            appName: params.appName,
        },
    };
}

// Get app metadata
export async function getAppMetadata(appId: string): Promise<ApiResponse<any>> {
    // Mock data for now
    return {
        success: true,
        data: {
            appId: appId,
            appName: "Sample App",
            appLogo: "https://example.com/logo.png",
        },
    };
}

// Update app metadata
export async function updateApp(params: {
    signedMessage: string;
    appId: string;
    appName: string;
    appDescription: string;
    email: string;
    domain?: string;
}): Promise<ApiResponse<{ appId: string }>> {
    // Mock data for now
    return {
        success: true,
        data: {
            appId: params.appId,
        },
    };
}

// Create new role
export async function createRole(params: {
    signedMessage: string;
    appId: string;
    roleName: string;
    roleDescription: string;
    toolPolicy: any[];
}): Promise<
    ApiResponse<{
        appId: string;
        roleId: string;
        roleVersion: string;
        lastUpdated: string;
    }>
> {
    // Mock data for now
    return {
        success: true,
        data: {
            appId: params.appId,
            roleId: "1",
            roleVersion: "init",
            lastUpdated: new Date().toISOString(),
        },
    };
}

// Get role details
export async function getRole(params: {
    appId: string;
    roleId: string;
}): Promise<
    ApiResponse<{
        roleId: string;
        roleVersion: string;
        toolPolicy: any[];
    }>
> {
    // Mock data for now
    return {
        success: true,
        data: {
            roleId: params.roleId,
            roleVersion: "1.0",
            toolPolicy: [],
        },
    };
}

// Update role
export async function updateRole(params: {
    signedMessage: string;
    appId: string;
    roleId: string;
    roleVersion: string;
    roleName: string;
    roleDescription: string;
    toolPolicy: any[];
}): Promise<
    ApiResponse<{
        appId: string;
        roleId: string;
        roleVersion: string;
    }>
> {
    // Mock data for now
    return {
        success: true,
        data: {
            appId: params.appId,
            roleId: params.roleId,
            roleVersion: params.roleVersion,
        },
    };
}

// Form complete vincent app for frontend
export async function formCompleteVincentApp( address: string): Promise<VincentApp> {
  await new Promise(resolve => setTimeout(resolve, 1000));
    // Mock data for now
    return {
      appCreator: "0xabcd...efgh",
        appMetadata: {
            appId: "24",
            appName: "Swapping App",
            description:
                "This is a sample application with full integration capabilities",
            email: "developer@example.com", // Added required email field
            domain: "swapping-watcher.example.com", // Optional domain
        },
        roles: [
            {
                roleId: "1",
                roleName: "Uniswap Watcher",
                roleDescription:
                    "This is a sample application with full integration capabilities",
                roleVersion: "1.0.0",
                enabled: true,
                toolPolicy: [
                    {
                        toolCId:
                            "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
                        policyCId:
                            "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
                    },
                ],
            },
            {
                roleId: "2",
                roleName: "Uniswap Trader",
                roleDescription:
                    "This is a sample application with full integration capabilities",
                roleVersion: "3.0.0",
                enabled: false,
                toolPolicy: [
                    {
                        toolCId:
                            "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
                        policyCId:
                            "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
                    },
                ],
            },
        ],
        delegatees: ["0xabcd...efgh"],
        enabled: true,
    };
}
