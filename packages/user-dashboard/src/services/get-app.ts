import { AppView } from "./types";
import { VincentContracts } from "./contract/contracts";

export async function formCompleteVincentAppForDev(address: string): Promise<AppView[]> {
    const contracts = new VincentContracts('datil');
    const apps = await contracts.getAppsByManager(address);

    // Map the app data and filter out deleted apps
    return apps
        .map((appData: any) => {
            // Extract the app data from the structured response
            const { app, versions } = appData;

            // Convert BigNumber ID values to regular numbers safely to avoid overflow
            const appId = app.id ? app.id.toString() : "0";
            const latestVersion = app.latestVersion ? app.latestVersion.toString() : "0";

            // Handle deploymentStatus which could be a BigNumber
            let deploymentStatus = 0;
            if (app.deploymentStatus !== undefined) {
                if (typeof app.deploymentStatus === 'object' && app.deploymentStatus._isBigNumber) {
                    deploymentStatus = parseInt(app.deploymentStatus.toString());
                } else {
                    deploymentStatus = app.deploymentStatus;
                }
            }

            // Check if the app is deleted
            const isDeleted = app.isDeleted === true;

            return {
                appId: parseInt(appId),
                appName: app.name,
                description: app.description,
                authorizedRedirectUris: app.authorizedRedirectUris || [],
                delegatees: app.delegatees || [],
                toolPolicies: versions || [],
                managementWallet: app.manager,
                currentVersion: parseInt(latestVersion),
                deploymentStatus,
                isDeleted
            };
        })
        .filter((app: AppView) => !app.isDeleted); // Filter out deleted apps
}
