import { ethers } from "ethers";
import {
    getProviderOrSignerForAppRegistry,
    getProviderOrSignerForAgentRegistry,
} from "./config";
import { LitContracts } from "@lit-protocol/contracts-sdk";

export async function addDelegatee(delegateeAddress: string) {
    const contract = getProviderOrSignerForAppRegistry(true);
    const tx = await contract.addDelegatee(delegateeAddress);
    await tx.wait();
    return tx;
}

export async function getDelegatees(appCreator: string) {
    const contract = getProviderOrSignerForAppRegistry();
    const delegatees = await contract.getDelegatees(appCreator);
    return delegatees;
}

export async function removeDelegatee(delegateeAddress: string) {
    const contract = getProviderOrSignerForAppRegistry(true);
    const tx = await contract.removeDelegatee(delegateeAddress);
    await tx.wait();
    return tx;
}

export async function getAppsPermittedForAgentPkp(agentPkpTokenId: any) {
    const contract =  getProviderOrSignerForAgentRegistry();
    const apps = await contract.getAppsPermittedForAgentPkp(agentPkpTokenId);
    return apps;
}

export async function isAppEnabled(
    agentPkpTokenId: any,
    appManager: string
) {
    const contract = getProviderOrSignerForAgentRegistry();
    const isEnabled = await contract.isAppEnabled(agentPkpTokenId, appManager);
    return isEnabled;
}

export async function getRolesPermittedForApp(
    agentPkpTokenId: any,
    appManager: string
) {
    const contract = getProviderOrSignerForAgentRegistry();
    const app = await contract.getRolesPermittedForApp(
        agentPkpTokenId,
        appManager
    );
    return app;
}

async function getTokenIdByPkpEthAddress(network: any, pkpEthAddress: string) {
    const litContracts = new LitContracts({
        network,
        debug: false,
    });
    await litContracts.connect();
    const contract = litContracts.pubkeyRouterContract.read;
    const tokenId = await contract.ethAddressToPkpId(pkpEthAddress);
    console.log("tokenId", tokenId);
    return tokenId;
}

// export async function addRole(appId: string, enabled: boolean) {
//     const contract = await getProviderOrSignerForAgentRegistry(true);
//     const tx = await contract.addRole(appId, enabled);
//     await tx.wait();
//     return tx;
// }
