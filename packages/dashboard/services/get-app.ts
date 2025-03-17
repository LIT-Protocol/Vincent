import { VincentApp } from "@/services/types";
import { VincentContracts } from "./contract/contracts";
import { BigNumber } from "ethers";

export async function formCompleteVincentAppForDev(address: string): Promise<VincentApp[]> {
    const contracts = new VincentContracts('datil');
    console.log('address', address);
    const apps = await contracts.getAppsByManager(address);
    console.log('apps', apps);

    return apps.map((appWithVersions: any) => {
        // The contract returns a struct containing app and versions
        const { app, versions } = appWithVersions;
        
        // Now we can safely access the latest version
        const latestVersionIndex = app.latestVersion > 0 ? app.latestVersion - 1 : 0;
        const latestVersionedAppData = app.latestVersion > 0 ? versions[latestVersionIndex] : null;
        const isEnabled = latestVersionedAppData ? latestVersionedAppData.enabled : false;

        return {
            appId: BigNumber.from(app.id).toNumber(),
            appName: app.name,
            description: app.description,
            managementWallet: app.manager,
            currentVersion: app.latestVersion,
            delegatees: app.delegatees,
            authorizedDomains: app.authorizedDomains,
            authorizedRedirectUris: app.authorizedRedirectUris,
            isEnabled: isEnabled,
            toolPolicies: latestVersionedAppData.tools,
            delegatedAgentPKPs: latestVersionedAppData ? latestVersionedAppData.delegatedAgentPkpTokenIds : [],
            appMetadata: {
                email: "", // Not fetching off-chain data for now
            },
        };
    });
}

// export async function formCompleteVincentAppForDev(address: string): Promise<VincentApp[]> {
//     return [{
//         appId: 0,
//         appName: "Test App",
//         description: "Test Description",
//         authorizedDomains: ["test.com"],
//         authorizedRedirectUris: ["https://test.com"],
//         delegatees: ["0x1234567890123456789012345678901234567890"],
//         toolPolicies: [],
//         managementWallet: address,
//         isEnabled: true,
//         appMetadata: {
//             email: "test@test.com",
//         },
//         currentVersion: 0,
//     }]
// }