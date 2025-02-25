import { ethers } from "ethers";
import {
    getProviderOrSignerForAppRegistry,
    getProviderOrSignerForUserRegistry,
} from "./config";

export async function addDelegatee(delegateeAddress: string) {
    const contract = getProviderOrSignerForAppRegistry(true);
    const tx = await contract.addDelegatee(delegateeAddress);
    await tx.wait();
    console.log("tx", tx);
    return tx;
}

export async function getDelegatees(appCreator: string) {
    // const appCreator = "0x66E724376D3F33c8FBCb0B7dB76acCfc0AE8D39F";
    const contract = getProviderOrSignerForAppRegistry();
    // console.log("contract", contract);
    const delegatees = await contract.getDelegatees(appCreator);
    // console.log("delegatees", delegatees);
    return delegatees;
}

export async function removeDelegatee(delegateeAddress: string) {
    const contract = getProviderOrSignerForAppRegistry(true);
    const tx = await contract.removeDelegatee(delegateeAddress);
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
    const contract =  getProviderOrSignerForUserRegistry();
    const apps = await contract.getAppsPermittedForAgentPkp(agentPkpTokenId);
    return apps;
}

export async function isAppEnabled(
    agentPkpTokenId: string,
    appManager: string
) {
    const contract = getProviderOrSignerForUserRegistry();
    const isEnabled = await contract.isAppEnabled(agentPkpTokenId, appManager);
    return isEnabled;
}

export async function getRolesPermittedForApp(
    agentPkpTokenId: string,
    appManager: string
) {
    const contract = getProviderOrSignerForUserRegistry();
    const app = await contract.getRolesPermittedForApp(
        agentPkpTokenId,
        appManager
    );
    return app;
}