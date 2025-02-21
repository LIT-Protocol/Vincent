import { SiweMessage } from "siwe";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_BE_BASE_URL || "http://localhost:3000/api/v1";

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// convert to authsig?
async function createSiweMessage(
    address: string,
    action: string,
    params: any
): Promise<string> {
    const paramsString = Object.entries(params)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join("\n");

    const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: `Sign in to perform action: ${action}\n\nParameters:\n${paramsString}`,
        uri: window.location.origin,
        version: "1",
        chainId: 1,
        nonce: Math.random().toString(36).slice(2),
        issuedAt: new Date().toISOString(),
    });
    const messageToSign = message.prepareMessage();
    const signedMessage = await window.ethereum.request({
        method: "personal_sign",
        params: [messageToSign, address],
    });
    return signedMessage;
}

// Register new app
export async function registerApp(
    address: string,
    params: {
        appName: string;
        appDescription: string;
        email: string;
        domain?: string;
    }
): Promise<ApiResponse<{ appId: string; appName: string; logo?: string }>> {
    const message = await createSiweMessage(address, "register_app", params);
    await new Promise((resolve) => setTimeout(resolve, 2000));
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
    await new Promise((resolve) => setTimeout(resolve, 2000));
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
export async function updateApp(
    address: string,
    params: {
        appId: string;
        appName: string;
        appDescription: string;
        email: string;
        domain?: string;
    }
): Promise<ApiResponse<{ appId: string }>> {
    const message = await createSiweMessage(address, "update_app", params);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Mock data for now
    return {
        success: true,
        data: {
            appId: params.appId,
        },
    };
}

// Create new role
export async function createRole(
    address: string,
    params: {
        appId: string;
        roleName: string;
        roleDescription: string;
        toolPolicy: any[];
    }
): Promise<
    ApiResponse<{
        appId: string;
        roleId: string;
        roleVersion: string;
        lastUpdated: string;
    }>
> {
    const message = await createSiweMessage(address, "create_role", params);
    await new Promise((resolve) => setTimeout(resolve, 2000));
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

export async function getRoleByAppId(appId: string) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Mock data for now
    return {
        success: true,
        data: {
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
    await new Promise((resolve) => setTimeout(resolve, 2000));
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
export async function updateRole(
    address: string,
    params: {
        appId: string;
        roleId: string;
        roleVersion: string;
        roleName: string;
        roleDescription: string;
        toolPolicy: any[];
    }
): Promise<
    ApiResponse<{
        appId: string;
        roleId: string;
        roleVersion: string;
    }>
> {
    const message = await createSiweMessage(address, "update_role", params);
    await new Promise((resolve) => setTimeout(resolve, 2000));
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
