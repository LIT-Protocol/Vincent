import { VincentApp } from "@/types";
import { getAppMetadata, getAllRoles, getRoleToolPolicy } from "./api";

export async function checkIfAppExists(address: string): Promise<Boolean> {
    const app = await getAppMetadata(address);
    console.log("app", app);
    return app ? true : false;
}

export async function formCompleteVincentAppForDev(
    managementWallet: string
): Promise<VincentApp> {
    
    const appMetadata = await getAppMetadata(managementWallet);
    console.log("appMetadata", appMetadata);
    const roleIds = await getAllRoles(managementWallet);
    console.log("roleIds", roleIds);
    
    const roles = await Promise.all(
        roleIds.map(async (roleId: any) => {
            const roleData = await getRoleToolPolicy({managementWallet, roleId});
            return {
                roleId: roleData.roleId,
                roleVersion: roleData.data.roleVersion,
                toolPolicy: roleData.data.toolPolicy.map((policy: any) => ({
                    toolCId: policy.tool.ipfsCid,
                    policyCId: policy.policy.schema[0].defaultValue, // Assuming this is where the CID is stored
                })),
                enabled: true, // Default to true, adjust if needed
                roleName: `Role ${roleData.data.roleId}`, // Add proper role name if available
                roleDescription: "Role description" // Add proper description if available
            };
        })
    );

    // Construct the complete Vincent App
    const completeVincentApp: VincentApp = {
        appCreator: managementWallet,
        appMetadata: {
            appId: appMetadata._id,
            appName: appMetadata.name,
            description: appMetadata.description,
            email: appMetadata.contactEmail,
            domain: undefined // Optional field
        },
        roles: roles,
        delegatees: [], // Add delegatees if available from somewhere
        enabled: true // Default to true, adjust if needed
    };

    return completeVincentApp;
}

// GET complete vincent app for frontend
export async function formCompleteVincentApp(
    address: string
): Promise<VincentApp> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    // Mock data for now
    return {
        appCreator: "0xc881ab7ED4346636D610571c63aBbeE6F24e6953",
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
        delegatees: [
            "0x1234567890abcdef1234567890abcdef12345678",
            "0xabcdef1234567890abcdef1234567890abcdef12",
            "0x7890abcdef1234567890abcdef1234567890abcd",
        ],
        enabled: true,
    };
}


export async function getVincentAppForUser(appId: string): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    // Mock data for now
    return {
        appId: "24",
        appName: "Swapping App",
        description: "This is a sample application with full integration capabilities",
        enabled: true,
        roles: [
            {
                roleId: "1",
                roleName: "Uniswap Watcher",
                roleDescription: "This is a sample application with full integration capabilities",
                enabled: true,
                toolPolicy: [
                    {
                        toolCId: "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
                        policyCId: "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
                    },
                ],
            },
        ],
    };
}