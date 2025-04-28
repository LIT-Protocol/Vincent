import { ethers } from 'ethers';

import { NETWORK_CONFIG } from './network-config';

export interface PolicyParameter {
    name: string;
    paramType: number;
    value: string;
}

export interface Policy {
    policyIpfsCid: string;
    parameters: PolicyParameter[];
}

export interface ToolExecutionResult {
    isPermitted: boolean;
    appId: ethers.BigNumber;
    appVersion: ethers.BigNumber;
    policies: Policy[];
}

export const getUserToolPolicies = async (
    yellowstoneProvider: ethers.providers.JsonRpcProvider,
    delegateeAddress: string,
    userPkpTokenId: string,
    toolIpfsCid: string
): Promise<ToolExecutionResult> => {
    const VINCENT_CONTRACT_ABI = [
        `function validateToolExecutionAndGetPolicies(address delegatee, uint256 pkpTokenId, string calldata toolIpfsCid) external view returns (tuple(bool isPermitted, uint256 appId, uint256 appVersion, tuple(string policyIpfsCid, tuple(string name, uint8 paramType, bytes value)[] parameters)[] policies) validation)`,
    ];

    const vincentContract = new ethers.Contract(
        NETWORK_CONFIG[LIT_NETWORK as keyof typeof NETWORK_CONFIG].vincentAddress,
        VINCENT_CONTRACT_ABI,
        yellowstoneProvider
    );

    const policies = await vincentContract.validateToolExecutionAndGetPolicies(
        delegateeAddress,
        userPkpTokenId,
        toolIpfsCid
    );

    const transformedPolicies = policies.policies.map((policy: { policyIpfsCid: string; parameters: { name: string; paramType: number; value: string }[] }) => ({
        policyIpfsCid: policy.policyIpfsCid,
        parameters: policy.parameters.map((param: { name: string; paramType: number; value: string }) => ({
            name: param.name,
            paramType: param.paramType,
            value: param.value
        }))
    }));

    return {
        ...policies,
        policies: transformedPolicies
    } as ToolExecutionResult;
}