import { ethers } from "ethers";
import {
    getProviderOrSignerForAppRegistry,
    getProviderOrSignerForUserRegistry,
} from "./config";

export async function addDelegatee(appId: string, delegateeAddress: string) {
    const contract = await getProviderOrSignerForAppRegistry(true);
    const tx = await contract.addDelegatee(appId, delegateeAddress);
    await tx.wait();
    return tx;
}

export async function getDelegatees(appId: string) {
    const contract = await getProviderOrSignerForAppRegistry();
    const delegatees = await contract.getDelegatees(appId);
    return delegatees;
}

export async function removeDelegatee(appId: string, delegateeAddress: string) {
    const contract = await getProviderOrSignerForAppRegistry(true);
    const tx = await contract.removeDelegatee(appId, delegateeAddress);
    await tx.wait();
    return tx;
}

// export async function addRole(appId: string, enabled: boolean) {
//     const contract = await getProviderOrSignerForUserRegistry(true);
//     const tx = await contract.addRole(appId, enabled);
//     await tx.wait();
//     return tx;
// }

export async function getAppsPermittedForAgentPkp(agentPkpTokenId: string) {
    const contract = await getProviderOrSignerForUserRegistry();
    const apps = await contract.getAppsPermittedForAgentPkp(agentPkpTokenId);
    return apps;
}

export async function isAppEnabled(
    agentPkpTokenId: string,
    appManager: string
) {
    const contract = await getProviderOrSignerForUserRegistry();
    const isEnabled = await contract.isAppEnabled(agentPkpTokenId, appManager);
    return isEnabled;
}

export async function getRolesPermittedForApp(
    agentPkpTokenId: string,
    appManager: string
) {
    const contract = await getProviderOrSignerForUserRegistry();
    const app = await contract.getRolesPermittedForApp(
        agentPkpTokenId,
        appManager
    );
    return app;
}
