"use client";

import {
    DEFAULT_REGISTRY_CONFIG,
    getPkpToolRegistryContract,
    getRegisteredToolsAndDelegatees,
} from "@lit-protocol/aw-contracts-sdk";
import { LitContracts } from "@lit-protocol/contracts-sdk";

function getPKPToolRegistryContract(network: any) {
    const contract = getPkpToolRegistryContract({
        rpcUrl: DEFAULT_REGISTRY_CONFIG[network].rpcUrl,
        contractAddress: DEFAULT_REGISTRY_CONFIG[network].contractAddress,
    });
    console.log("registry", contract);
    return contract;
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

async function fetchDetails(network: any, pkpEthAddress: string) {
    // const network = "datil-test";
    // const pkpEthAddress = "0x9bb681f026e31DB3693C05129a36E00da6418898";

    const tokenId = await getTokenIdByPkpEthAddress(
        network,
        pkpEthAddress
    );

    const litContracts = new LitContracts({
        network,
        debug: false,
    });
    await litContracts.connect();
    const registryContract = getPKPToolRegistryContract(network);
    const details = await getRegisteredToolsAndDelegatees(
        registryContract,
        litContracts,
        tokenId.toString()
    );
    console.log("details", details);
}