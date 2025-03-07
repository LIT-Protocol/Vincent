import { VincentApp } from "@/types";
import { getAppMetadata, getAllRoles, getRoleToolPolicy } from "./api";
import { LitContracts } from "@lit-protocol/contracts-sdk";
import { getProviderOrSignerForAppRegistry, getProviderOrSignerForAgentRegistry } from "./config";
import {
    getAppsPermittedForAgentPkp,
    isAppEnabled,
    getRolesPermittedForApp,
    getDelegatees,
} from "./contract";
import { ethers } from "ethers";

export async function checkIfAppExists(address: string): Promise<Boolean> {
    try {
        const app = await getAppMetadata(address);
        return app ? true : false;
    } catch (error) {
        return false;
    }
}

export async function formCompleteVincentAppForDev(
    managementWallet: string
): Promise<VincentApp> {
    const appMetadata = await getAppMetadata(managementWallet);
    const response = await getAllRoles(managementWallet);
    const array = response?.roles || [];

    const roles = await Promise.all(
        array.map(async (id: any) => {
            const roleData = await getRoleToolPolicy({
                managementWallet,
                roleId: id.roleId,
            });

            return {
                roleId: roleData.roleId,
                roleDescription: roleData.roleDescription,
                roleName: roleData.roleName,
                toolPolicy: roleData.toolPolicy.map((id: any) => ({
                    toolIpfsCid: id.toolIpfsCid,
                    description: id.description,
                    policyVarsSchema: id.policyVarsSchema,
                })),
            };
        })
    );

    const delegatees = await getDelegatees(managementWallet);

    // Construct the complete Vincent App
    const completeVincentApp: VincentApp = {
        appCreator: managementWallet,
        appMetadata: {
            appName: appMetadata.name,
            description: appMetadata.description,
            email: appMetadata.contactEmail,
        },
        roles: roles,
        delegatees: delegatees,
        // delegatees: [],
    };

    return completeVincentApp;
}

export async function loadUserApps(
    userPkpEthAddress: string
): Promise<any> {
    console.log("loading apps for user pkp: ", userPkpEthAddress)

    const provider = new ethers.providers.JsonRpcProvider("https://yellowstone-rpc.litprotocol.com");
    const litContracts = new LitContracts({
        provider: provider,
        network: "datil"
    });
    await litContracts.connect();

    let pkpTokenIds =
        await litContracts.pkpPermissionsContract.read.getTokenIdsForAuthMethod(
            1,
            userPkpEthAddress
        )

    console.log("pkps owned by user pkps: ", pkpTokenIds);

    const agentRegistryContract = getProviderOrSignerForAgentRegistry(false);
    console.log("agentRegistryContract", agentRegistryContract)
    let count = 0;
    let awTokenIds: any[] = [];

    const enabled = await isAppEnabled(pkpTokenIds[0], "0xD4383c15158B11a4Fa51F489ABCB3D4E43511b0a");
    console.log("enabled", enabled);

    while (count < pkpTokenIds.length) {
        console.log("checking pkp token id: ", pkpTokenIds[count]);
        const check = await agentRegistryContract.hasAgentPkp(pkpTokenIds[count]);
        if (check) {
            console.log("true")
            awTokenIds.push(pkpTokenIds[count]);
        }
        else {
            console.log("false")
        }
        count++;
    }

    console.log("aw pkps: ", awTokenIds);

    // const awTokenIds = pkpTokenIds;

    // Get all permitted apps for each agent PKP and flatten the results
    const allAppsWithDetails = await Promise.all(
        awTokenIds?.map(async (agentTokenId) => {
            const permittedApps: string[] =
                await getAppsPermittedForAgentPkp(agentTokenId);

            // For each permitted app of this agent, get the details
            const appsWithDetails: any[] = await Promise.all(
                permittedApps.map(async (appManager) => {
                    const enabled = await isAppEnabled(
                        agentTokenId,
                        appManager
                    );
                    const appMetadata = await getAppMetadata(appManager);
                    const roleIds = await getRolesPermittedForApp(
                        agentTokenId,
                        appManager
                    );

                    // Get tool policies for each role
                    const roles = await Promise.all(
                        roleIds?.map(async (roleId: any) => {
                            const roleData = await getRoleToolPolicy({
                                managementWallet: appManager,
                                roleId: roleId,
                            });
                            return {
                                roleId: roleData.roleId,
                                toolPolicy: roleData.toolPolicy.map(
                                    (policy: any) => ({
                                        toolCId: policy.ipfsCid,
                                        policyVarsSchema:
                                            policy.policyVarsSchema,
                                    })
                                ),
                            };
                        })
                    );

                    return {
                        awTokenId: agentTokenId,
                        appManager,
                        appMetadata: {
                            appName: appMetadata.name,
                            description: appMetadata.description,
                            email: appMetadata.contactEmail,
                        },
                        enabled,
                        roles,
                    };
                })
            );

            return appsWithDetails;
        })
    );

    return allAppsWithDetails;
}

// export async function getVincentAppForUser(address: string): Promise<any> {
//     await new Promise((resolve) => setTimeout(resolve, 200));
//     // Mock data for now
//     return [{
//         appCreatorAddress: "0xc881ab7ED4346636D610571c63aBbeE6F24e6953",
//         appName: "Base DCA Demo",
//         description:
//             "A demo DCA application from Lit Protocol. DCA is done for the top token on Base provided a purchase amount and frequency.",
//         enabled: true,
//         roles: [
//             {
//                 roleId: "1",
//                 roleName: "Uniswap Base Swap",
//                 roleDescription:
//                     "Allow Swapping with Uniswap on Base. Swapping is limited by a user-defined policy, restricting the amount that can be swapped in a single transaction.",
//                 toolPolicy: [
//                     {
//                         toolCId:
//                             "Qmap3Qadj4FBPhSEor1rbnNdbZSE56ptFS7KH4XS716oJg",
//                         policyVarsSchema: [
//                             {
//                                 paramName: "Maximum Transaction Amount",
//                                 typeValue: "string",
//                                 defaultValue: "0",
//                             },
//                         ],
//                     },
//                 ],
//             },
//         ],
//     }];
// }

// // GET complete vincent app for frontend
// export async function formCompleteVincentApp(
//     address: string
// ): Promise<VincentApp> {
//     await new Promise((resolve) => setTimeout(resolve, 200));
//     // Mock data for now
//     return {
//         appCreator: "0xc881ab7ED4346636D610571c63aBbeE6F24e6953",
//         appMetadata: {
//             appId: "24",
//             appName: "Swapping App",
//             description:
//                 "This is a sample application with full integration capabilities",
//             email: "developer@example.com", // Added required email field
//             domain: "swapping-watcher.example.com", // Optional domain
//         },
//         roles: [
//             {
//                 roleId: "1",
//                 roleName: "Uniswap Watcher",
//                 roleDescription:
//                     "This is a sample application with full integration capabilities",
//                 roleVersion: "1.0.0",
//                 enabled: true,
//                 toolPolicy: [
//                     {
//                         toolCId:
//                             "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
//                         policyCId:
//                             "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
//                     },
//                 ],
//             },
//             {
//                 roleId: "2",
//                 roleName: "Uniswap Trader",
//                 roleDescription:
//                     "This is a sample application with full integration capabilities",
//                 roleVersion: "3.0.0",
//                 enabled: false,
//                 toolPolicy: [
//                     {
//                         toolCId:
//                             "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
//                         policyCId:
//                             "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
//                     },
//                 ],
//             },
//         ],
//         delegatees: [
//             "0x1234567890abcdef1234567890abcdef12345678",
//             "0xabcdef1234567890abcdef1234567890abcdef12",
//             "0x7890abcdef1234567890abcdef1234567890abcd",
//         ],
//         enabled: true,
//     };
// }
