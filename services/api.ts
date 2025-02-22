import { SiweMessage } from "siwe";
import axios from "axios";

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
        // domain?: string;
    }
): Promise<ApiResponse<{ appId: string; appName: string; logo?: string }>> {
    const signedMessage = await createSiweMessage(address, "register_app", params);
    
    // Keep mock data as comment
    /* Mock data
    return {
        success: true,
        data: {
            appId: "1",
            appName: params.appName,
        },
    };
    */

    const config = {
        headers: {
            "Content-Type": "application/json",
        },
    };
    
    const response = await axios.post(`${API_BASE_URL}/registerApp`, {
        signedMessage,
        ...params
    });
    console.log(response.data);
    return response.data;
}

// Get app metadata
export async function getAppMetadata(appId: string): Promise<ApiResponse<any>> {
    /* Mock data
    return {
        success: true,
        data: {
            appId: appId,
            appName: "Sample App",
            appLogo: "https://example.com/logo.png",
        },
    };
    */
    
    const response = await axios.get(`${API_BASE_URL}/appMetadata`, {
        params: { appId }
    });
    return response.data;
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
    const signedMessage = await createSiweMessage(address, "update_app", params);
    
    /* Mock data
    return {
        success: true,
        data: {
            appId: params.appId,
        },
    };
    */
    
    const response = await axios.put(`${API_BASE_URL}/updateApp`, {
        signedMessage,
        ...params
    });
    return response.data;
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
): Promise<ApiResponse<{
    appId: string;
    roleId: string;
    roleVersion: string;
    lastUpdated: string;
}>> {
    const signedMessage = await createSiweMessage(address, "create_role", params);
    
    /* Mock data
    return {
        success: true,
        data: {
            appId: params.appId,
            roleId: "1",
            roleVersion: "init",
            lastUpdated: new Date().toISOString(),
        },
    };
    */
    
    const response = await axios.post(`${API_BASE_URL}/createRole`, {
        signedMessage,
        ...params
    });
    return response.data;
}

export async function getRoleByAppId(appId: string) {
    /* Mock data
    return {
        success: true,
        data: {
            roleId: "1",
            roleVersion: "init",
            lastUpdated: new Date().toISOString(),
        },
    };
    */
    
    const response = await axios.get(`${API_BASE_URL}/roles`, {
        params: { appId }
    });
    return response.data;
}

// Get role details
export async function getRole(params: {
    appId: string;
    roleId: string;
}): Promise<ApiResponse<{
    roleId: string;
    roleVersion: string;
    toolPolicy: any[];
}>> {
    /* Mock data
    return {
        success: true,
        data: {
            roleId: params.roleId,
            roleVersion: "1.0",
            toolPolicy: [],
        },
    };
    */
    
    const response = await axios.get(`${API_BASE_URL}/role`, {
        params
    });
    return response.data;
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
): Promise<ApiResponse<{
    appId: string;
    roleId: string;
    roleVersion: string;
}>> {
    const signedMessage = await createSiweMessage(address, "update_role", params);
    
    /* Mock data
    return {
        success: true,
        data: {
            appId: params.appId,
            roleId: params.roleId,
            roleVersion: params.roleVersion,
        },
    };
    */
    
    const response = await axios.put(`${API_BASE_URL}/updateRole`, {
        signedMessage,
        ...params
    });
    return response.data;
}
