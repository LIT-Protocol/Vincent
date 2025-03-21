import { AppView } from "./types";
import { VincentContracts } from "./contract/contracts";
import { BigNumber } from "ethers";

export async function formCompleteVincentAppForDev(address: string): Promise<AppView[]> {
    const contracts = new VincentContracts('datil');
    const apps = await contracts.getAppsByManager(address);

    return apps.map((appData: [any[], any[]], index: number) => {
        const [app, versions] = appData;
        const [
            id,
            name,
            description,
            manager,
            latestVersion,
            delegatees,
            authorizedRedirectUris
        ] = app;

        const latestVersionData = versions[versions.length - 1]
        const isEnabled = latestVersionData ? latestVersionData.enabled : false;

        return {
            appId: BigNumber.from(id).toNumber(),
            appName: name,
            description: description,
            authorizedRedirectUris: authorizedRedirectUris,
            delegatees: delegatees,
            toolPolicies: versions,
            managementWallet: manager,
            isEnabled: isEnabled,
            appMetadata: {
                email: "", // Not fetching off-chain data for now
            },
            currentVersion: BigNumber.from(latestVersion).toNumber(),
        };
    });
}