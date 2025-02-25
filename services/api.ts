import { SiweMessage } from "siwe";
import axios from "axios";
import { verifyMessage } from "ethers/lib/utils";
import { Role } from "@/types";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_BE_BASE_URL || "http://localhost:8000/api/v1";
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
async function createSiweMessage(address: string, action: string, params = {}) {
    const message = new SiweMessage({
        domain: "localhost", // Use actual domain from window
        address,
        statement: "Log in to App Registry with your Admin Wallet",
        uri: "https://localhost/*", // Use actual origin from window
        version: "1",
        chainId: 1,
        nonce: Math.random().toString(36).slice(2),
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
    });

    const preparedMessage = message.prepareMessage();

    const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [preparedMessage, address],
    });

    const signerAddress = verifyMessageWithEthers(preparedMessage, signature);
    console.log("signerAddress", signerAddress);

    return {
        message: preparedMessage,
        signature,
    };
}

function verifyMessageWithEthers(message: any, signature: string) {
    const signerAddress = verifyMessage(message, signature);
    return signerAddress;
}

// Register new app
export async function registerApp(
    address: string,
    params: {
        name: string;
        description: string;
        contactEmail: string;
        // domain?: string;
    }
) {
    const signedMessage = await createSiweMessage(
        address,
        "register_app",
        params
    );

    const body = {
        ...params,
        signedMessage: JSON.stringify(signedMessage),
    };

    const response = await axios.post(`${API_BASE_URL}/registerApp`, body);
    console.log("registerApp response", response);
    return response.data;
}

// Update app metadata
export async function updateApp(
    address: string,
    params: {
        contactEmail: string;
        description: string;
        name: string;
    }
) {
    const signedMessage = await createSiweMessage(
        address,
        "update_app",
        params
    );

    /* Mock data
    return {
        success: true,
        data: {
            appId: params.appId,
        },
    };
    */

    const response = await axios.put(`${API_BASE_URL}/updateApp`, {
        ...params,
        signedMessage,
    });
    return response.data;
}

// Create new role
export async function createRole(
    address: string,
    params: {
        name: string;
        description: string;
        toolPolicy: any[];
    }
): Promise<
    ApiResponse<{
        role: any;
    }>
> {
    const signedMessage = await createSiweMessage(
        address,
        "create_role",
        params
    );

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
        ...params,
        signedMessage,
    });
    return response.data;
}

// Update role
export async function updateRole(
    address: string,
    params: {
        description: string;
        name: string;
        roleId: string;
        toolPolicy: any[];
    }
) {
    const signedMessage = await createSiweMessage(
        address,
        "update_role",
        params
    );

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
        ...params,
    });
    return response.data;
}

// Get app metadata
export async function getAppMetadata(address: string) {
    const response = await axios.get(`${API_BASE_URL}/appMetadata/${address}`);
    return response.data.data;
}

// Get all roles for an app
export async function getAllRoles(managementWallet: string) {
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

    const response = await axios.get(`${API_BASE_URL}/getAllRoles`, {
        params: {
            managementWallet: managementWallet,
        },
    });
    return response.data.data;
}

// Get role details
export async function getRoleToolPolicy(params: {
    managementWallet: string;
    roleId: string;
}) {
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
        params,
    });
    return response.data;
}
