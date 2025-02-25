import { ethers } from "ethers";
import { getProviderOrSigner } from "./config";

export async function registerApp(appId: string) {
    const contract = await getProviderOrSigner(true);
    const tx = await contract.registerApp(appId);
    await tx.wait();
}

export async function getAppIdFromManagerAddress(address: string) {
    const contract = await getProviderOrSigner();
    const addressToAppId = await contract.managerToApps(address);
    return addressToAppId;
}

export async function registerRole(appId: string) {}

export async function addDelegatee(appId: string, delegateeAddress: string) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // TODO: Implement
}

export async function getDelegatees(appId: string) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // TODO: Implement
}

// TODO: Later
export async function removeDelegatee(appId: string, delegateeAddress: string) {}