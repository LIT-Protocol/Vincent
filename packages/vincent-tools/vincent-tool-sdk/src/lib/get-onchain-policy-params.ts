import { z } from "zod";
import { ethers } from "ethers";

import type { Policy, VincentPolicyDef } from "./types";
import { abiDecodePolicyParameters } from "./abi-decode-policy-params";

interface AllOnChainPolicyParams {
    isPermitted: boolean;
    appId: ethers.BigNumber;
    appVersion: ethers.BigNumber;
    policies: Policy[];
}

export const getOnChainPolicyParams = async (args: {
    yellowstoneRpcUrl: string,
    vincentContractAddress: string,
    appDelegateeAddress: string,
    agentWalletPkpTokenId: string,
    toolIpfsCid: string,
    policyIpfsCid: string,
    policyUserParamsSchema?: z.infer<VincentPolicyDef['userParamsSchema']>
}): Promise<z.infer<VincentPolicyDef['userParamsSchema'] | undefined>> => {
    try {
        const allOnChainPolicyParams = await _getAllOnChainPolicyParams(args);

        // We exit early here because !allOnChainPolicyParams.isPermitted means appDelegateeAddress
        // is not permitted to execute toolIpfsCid for the Vincent App on behalf of the agentWalletPkpTokenId
        // and no further processing is needed
        if (!allOnChainPolicyParams.isPermitted) {
            throw new Error(`App Delegatee: ${args.appDelegateeAddress} is not permitted to execute Vincent Tool: ${args.toolIpfsCid} for App ID: ${allOnChainPolicyParams.appId.toString()} App Version: ${allOnChainPolicyParams.appVersion.toString()} using Agent Wallet PKP Token ID: ${args.agentWalletPkpTokenId}`);
        }

        const onChainPolicyParams = allOnChainPolicyParams.policies.find(
            (policy) => policy.policyIpfsCid === args.policyIpfsCid
        );

        if (args.policyUserParamsSchema) {
            if (!onChainPolicyParams) {
                // All user Policy params can be optional, so if no parameters were set on-chain,
                // we want to validate an empty object (i.e. no parameters) against the userParamsSchema
                // to validate that there are no required Policy params
                return args.policyUserParamsSchema.parse({});
            } else {
                const decodedPolicyParams = abiDecodePolicyParameters({ params: onChainPolicyParams.parameters });
                return args.policyUserParamsSchema.parse(decodedPolicyParams);
            }
        } else {
            if (!onChainPolicyParams) {
                return;
            } else {
                throw new Error(`Agent Wallet PKP Token ID: ${args.agentWalletPkpTokenId} has registered on-chain Policy parameters for Vincent App: ${allOnChainPolicyParams.appId.toString()} App Version: ${allOnChainPolicyParams.appVersion.toString()} Vincent Policy: ${args.policyIpfsCid} Vincent Tool: ${args.toolIpfsCid} but no userParamsSchema was defined by the Policy`);
            }
        }
    } catch (error) {
        throw new Error(`Error getting on-chain policy parameters (getOnChainPolicyParams): ${error instanceof Error ? error.message : String(error)}`);
    }
}

const _getAllOnChainPolicyParams = async (args: {
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
            args.vincentContractAddress,
            VINCENT_CONTRACT_ABI,
            new ethers.providers.JsonRpcProvider(
                args.yellowstoneRpcUrl
            )
        );

        return vincentContract.validateToolExecutionAndGetPolicies(
            args.appDelegateeAddress,
            args.agentWalletPkpTokenId,
            args.toolIpfsCid
        );
    } catch (error) {
        throw new Error(`Error getting on-chain policy parameters from Vincent contract: ${args.vincentContractAddress} using App Delegatee: ${args.appDelegateeAddress} and Agent Wallet PKP Token ID: ${args.agentWalletPkpTokenId} and Vincent Tool: ${args.toolIpfsCid}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
