import { z } from "zod";
import { ethers } from "ethers";

import type { VincentPolicyDef } from "./types";
import type { EthersAbiDecodedValue, Policy } from "./lit-actions/types";
import { abiDecodePolicyParameters } from "./abi-decode-policy-params";
import { formatZodErrorString } from "./format-zod-error-string";

interface AllOnChainPolicyParams {
    isPermitted: boolean;
    appId: ethers.BigNumber;
    appVersion: ethers.BigNumber;
    policies: Policy[];
}

export const getOnChainPolicyParams = async ({
    yellowstoneRpcUrl,
    vincentContractAddress,
    appDelegateeAddress,
    agentWalletPkpTokenId,
    toolIpfsCid,
    policyIpfsCid,
    policyUserParamsSchema,
}: {
    yellowstoneRpcUrl: string,
    vincentContractAddress: string,
    appDelegateeAddress: string,
    agentWalletPkpTokenId: string,
    toolIpfsCid: string,
    policyIpfsCid: string,
    policyUserParamsSchema?: z.infer<VincentPolicyDef['userParamsSchema']>
}): Promise<z.infer<VincentPolicyDef['userParamsSchema'] | undefined>> => {
    const allOnChainPolicyParams = await _getAllOnChainPolicyParams({
        yellowstoneRpcUrl,
        vincentContractAddress,
        appDelegateeAddress,
        agentWalletPkpTokenId,
        toolIpfsCid,
    });

    // We exit early here because !allOnChainPolicyParams.isPermitted means appDelegateeAddress
    // is not permitted to execute toolIpfsCid for the Vincent App on behalf of the agentWalletPkpTokenId
    // and no further processing is needed
    if (!allOnChainPolicyParams.isPermitted) {
        throw new Error(`App Delegatee: ${appDelegateeAddress} is not permitted to execute Vincent Tool: ${toolIpfsCid} for App ID: ${allOnChainPolicyParams.appId.toString()} App Version: ${allOnChainPolicyParams.appVersion.toString()} using Agent Wallet PKP Token ID: ${agentWalletPkpTokenId}`);
    }

    const onChainPolicyParams = allOnChainPolicyParams.policies.find(
        (policy) => policy.policyIpfsCid === policyIpfsCid
    );

    if (!policyUserParamsSchema && !onChainPolicyParams) {
        return;
    }

    if (!policyUserParamsSchema && onChainPolicyParams) {
        throw new Error(`Agent Wallet PKP Token ID: ${agentWalletPkpTokenId} has registered on-chain Policy parameters for Vincent App: ${allOnChainPolicyParams.appId.toString()} App Version: ${allOnChainPolicyParams.appVersion.toString()} Vincent Policy: ${policyIpfsCid} Vincent Tool: ${toolIpfsCid} but no userParamsSchema was defined by the Policy`);
    }

    if (policyUserParamsSchema && !onChainPolicyParams) {
        // All user Policy params can be optional, so if no parameters were set on-chain,
        // we want to validate an empty object (i.e. no parameters) against the userParamsSchema
        // to validate that there are no required Policy params
        return parseOnChainPolicyParams(policyUserParamsSchema.parse({}));
    }

    if (policyUserParamsSchema && onChainPolicyParams) {
        const decodedPolicyParams = abiDecodePolicyParameters({ params: onChainPolicyParams.parameters });
        return parseOnChainPolicyParams(policyUserParamsSchema.parse(decodedPolicyParams));
    }
}

const _getAllOnChainPolicyParams = async ({
    yellowstoneRpcUrl,
    vincentContractAddress,
    appDelegateeAddress,
    agentWalletPkpTokenId,
    toolIpfsCid,
}: {
    yellowstoneRpcUrl: string,
    vincentContractAddress: string,
    appDelegateeAddress: string,
    agentWalletPkpTokenId: string,
    toolIpfsCid: string,
}): Promise<AllOnChainPolicyParams> => {
    try {
        const VINCENT_CONTRACT_ABI = [
            `function validateToolExecutionAndGetPolicies(address delegatee, uint256 pkpTokenId, string calldata toolIpfsCid) external view returns (tuple(bool isPermitted, uint256 appId, uint256 appVersion, tuple(string policyIpfsCid, tuple(string name, uint8 paramType, bytes value)[] parameters)[] policies) validation)`,
        ];

        const vincentContract = new ethers.Contract(
            vincentContractAddress,
            VINCENT_CONTRACT_ABI,
            new ethers.providers.StaticJsonRpcProvider(
                yellowstoneRpcUrl
            )
        );

        return vincentContract.validateToolExecutionAndGetPolicies(
            appDelegateeAddress,
            agentWalletPkpTokenId,
            toolIpfsCid
        );
    } catch (error) {
        throw new Error(`Error getting on-chain policy parameters from Vincent contract: ${vincentContractAddress} using App Delegatee: ${appDelegateeAddress} and Agent Wallet PKP Token ID: ${agentWalletPkpTokenId} and Vincent Tool: ${toolIpfsCid}: ${error instanceof Error ? error.message : String(error)}`);
    }
}

const parseOnChainPolicyParams = ({ onChainPolicyParams, policyUserParamsSchema }: { onChainPolicyParams: Record<string, EthersAbiDecodedValue>, policyUserParamsSchema?: z.infer<VincentPolicyDef['userParamsSchema']> }) => {
    try {
        return policyUserParamsSchema.parse(onChainPolicyParams);
    } catch (error) {
        const errorMessage = error instanceof z.ZodError ? formatZodErrorString(error) : error instanceof Error ? error.message : String(error);
        throw new Error(`Error parsing on-chain policy parameters using Zod userParamsSchema (parseOnChainPolicyParams): ${errorMessage}`);
    }
}
