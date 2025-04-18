"use client";

import { useState, useEffect, useRef } from "react";
import { VersionInfo } from "@/components/consent/types";
import { getContract, estimateGasWithBuffer } from "@/services/contract/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Info } from "lucide-react";
import { VincentContracts } from "@/services";
import { useErrorPopup } from "@/providers/error-popup";
import { mapTypeToEnum } from "@/services/types";
import { mapEnumToTypeName, ParameterType } from "@/services/types";
import { StatusMessage } from "@/utils/statusMessage";
import { LazyInput } from "@/app/appId/[appId]/tool-policies/components/lazyInput";
import { LazySelect } from "@/app/appId/[appId]/tool-policies/components/lazySelect";
import { ToolPolicyWithId, PolicyWithId, ToolPolicyManagerProps } from "@/app/appId/[appId]/tool-policies/types";

export default function ManageToolPoliciesScreen({
    onBack,
    dashboard,
}: ToolPolicyManagerProps) {
    // Data state
    const [toolPolicies, setToolPolicies] = useState<ToolPolicyWithId[]>([]);
    
    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ message: string; type: 'info' | 'warning' | 'success' | 'error' } | null>(null);
    const { showError } = useErrorPopup();
    const [isFetching, setIsFetching] = useState(false);
    
    // Keep a reference to the form state to avoid re-renders
    const toolPoliciesRef = useRef<ToolPolicyWithId[]>([]);

    // Make sure our ref stays in sync with state
    useEffect(() => {
        toolPoliciesRef.current = toolPolicies;
    }, [toolPolicies]);

    useEffect(() => {
        if (dashboard?.appId && !isFetching) {
            fetchAppVersion();
        }
    }, [dashboard?.appId]);

    const fetchAppVersion = async () => {
        if (!dashboard?.appId) return;
        
        setIsFetching(true);
        try {
            const contracts = new VincentContracts('datil');
            const appVersion = await contracts.getAppVersion(dashboard.appId, dashboard.currentVersion);
            
            const appVersionInfo = appVersion as VersionInfo;
            const formattedTools = appVersionInfo.appVersion.tools.map(tool => {
                const formattedTool: ToolPolicyWithId = {
                    _id: crypto.randomUUID(),
                    toolIpfsCid: tool.toolIpfsCid,
                    policies: []
                };
                
                if (tool.policies && tool.policies.length > 0) {
                    tool.policies.forEach(policyData => {
                        const policy: PolicyWithId = {
                            _id: crypto.randomUUID(),
                            policyIpfsCid: policyData.policyIpfsCid,
                            parameters: []
                        };
                        
                        if (policyData.parameterNames && policyData.parameterNames.length > 0) {
                            policyData.parameterNames.forEach((name, index) => {
                                const typeValue = policyData.parameterTypes[index] !== undefined ? 
                                    policyData.parameterTypes[index] : 
                                    ParameterType.STRING;
                                
                                const typeName = mapEnumToTypeName(Number(typeValue)) || "string";
                                
                                policy.parameters.push({
                                    _id: crypto.randomUUID(),
                                    name: name,
                                    type: typeName
                                });
                            });
                        }
                        
                        formattedTool.policies.push(policy);
                    });
                }
                
                return formattedTool;
            });
            
            const validTools = formattedTools.filter(tool => !!tool.toolIpfsCid);
            
            if (validTools.length === 0) {
                validTools.push(createEmptyToolPolicy());
            }
            
            setToolPolicies(validTools);
            toolPoliciesRef.current = validTools;
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching app version:", error);
            
            const emptyTool = createEmptyToolPolicy();
            setToolPolicies([emptyTool]);
            toolPoliciesRef.current = [emptyTool];
            setIsLoading(false);
        } finally {
            setIsFetching(false);
        }
    };

    function createEmptyToolPolicy(): ToolPolicyWithId {
        return {
            _id: crypto.randomUUID(),
            toolIpfsCid: "",
            policies: []
        };
    }

    // State updaters with batched updates
    const handleAddTool = () => {
        const updatedTools = [...toolPoliciesRef.current, createEmptyToolPolicy()];
        setToolPolicies(updatedTools);
    };

    const handleRemoveTool = (toolId: string) => {
        if (toolPoliciesRef.current.length <= 1) return;
        setToolPolicies(toolPoliciesRef.current.filter(tool => tool._id !== toolId));
    };

    const handleUpdateTool = (toolId: string, field: string, value: string) => {
        const updatedTools = toolPoliciesRef.current.map(tool => 
            tool._id === toolId 
                ? { ...tool, [field]: value } 
                : tool
        );
        setToolPolicies(updatedTools);
    };

    const handleAddPolicy = (toolId: string) => {
        const updatedTools = toolPoliciesRef.current.map(tool => 
            tool._id === toolId 
                ? {
                    ...tool,
                    policies: [
                        ...tool.policies,
                        {
                            _id: crypto.randomUUID(),
                            policyIpfsCid: "",
                            parameters: [{
                                _id: crypto.randomUUID(),
                                name: "",
                                type: "string"
                            }]
                        }
                    ]
                } 
                : tool
        );
        setToolPolicies(updatedTools);
    };

    const handleRemovePolicy = (toolId: string, policyId: string) => {
        const updatedTools = toolPoliciesRef.current.map(tool => 
            tool._id === toolId 
                ? {
                    ...tool,
                    policies: tool.policies.filter(policy => policy._id !== policyId)
                } 
                : tool
        );
        setToolPolicies(updatedTools);
    };

    const handleUpdatePolicy = (toolId: string, policyId: string, field: string, value: string) => {
        const updatedTools = toolPoliciesRef.current.map(tool => 
            tool._id === toolId 
                ? {
                    ...tool,
                    policies: tool.policies.map(policy => 
                        policy._id === policyId 
                            ? { ...policy, [field]: value } 
                            : policy
                    )
                } 
                : tool
        );
        setToolPolicies(updatedTools);
    };

    const handleAddParameter = (toolId: string, policyId: string) => {
        const updatedTools = toolPoliciesRef.current.map(tool => 
            tool._id === toolId 
                ? {
                    ...tool,
                    policies: tool.policies.map(policy => 
                        policy._id === policyId 
                            ? {
                                ...policy,
                                parameters: [
                                    ...policy.parameters,
                                    {
                                        _id: crypto.randomUUID(),
                                        name: "",
                                        type: "string"
                                    }
                                ]
                            } 
                            : policy
                    )
                } 
                : tool
        );
        setToolPolicies(updatedTools);
    };

    const handleRemoveParameter = (toolId: string, policyId: string, parameterId: string) => {
        const updatedTools = toolPoliciesRef.current.map(tool => 
            tool._id === toolId 
                ? {
                    ...tool,
                    policies: tool.policies.map(policy => 
                        policy._id === policyId 
                            ? {
                                ...policy,
                                parameters: policy.parameters.filter(param => param._id !== parameterId)
                            } 
                            : policy
                    )
                } 
                : tool
        );
        setToolPolicies(updatedTools);
    };

    const handleUpdateParameter = (toolId: string, policyId: string, parameterId: string, field: string, value: string) => {
        const updatedTools = toolPoliciesRef.current.map(tool => 
            tool._id === toolId 
                ? {
                    ...tool,
                    policies: tool.policies.map(policy => 
                        policy._id === policyId 
                            ? {
                                ...policy,
                                parameters: policy.parameters.map(param => 
                                    param._id === parameterId 
                                        ? { ...param, [field]: value } 
                                        : param
                                )
                            } 
                            : policy
                    )
                } 
                : tool
        );
        setToolPolicies(updatedTools);
    };

    async function handleSaveToolPolicies() {
        setIsSubmitting(true);
        setStatusMessage({ message: "Preparing transaction...", type: "info" });
        
        try {
            const contract = await getContract('datil', 'App', true);
            
            const validToolPolicies = toolPoliciesRef.current.filter(tool => !!tool.toolIpfsCid);
            const toolIpfsCids = validToolPolicies.map(tool => tool.toolIpfsCid || "");
            const toolPolicyPolicies = validToolPolicies.map(tool => 
                tool.policies
                    .filter(policy => !!policy.policyIpfsCid)
                    .map(policy => policy.policyIpfsCid)
            ); 
            const toolPolicyParameterNames = validToolPolicies.map(tool => 
                tool.policies.map(policy => 
                    policy.parameters
                        .filter(param => !!param.name && param.name.trim() !== '')
                        .map(param => param.name.trim())
                )
            );
            const toolPolicyParameterTypes = validToolPolicies.map(tool => 
                tool.policies.map(policy => 
                    policy.parameters
                        .filter(param => !!param.name && param.name.trim() !== '')
                        .map(param => mapTypeToEnum(param.type || "string"))
                )
            );
            
            try {
                // Create the versionTools tuple argument as expected by the contract
                const versionTools = {
                    toolIpfsCids: toolIpfsCids,
                    toolPolicies: toolPolicyPolicies,
                    toolPolicyParameterNames: toolPolicyParameterNames,
                    toolPolicyParameterTypes: toolPolicyParameterTypes
                };
                
                // Use tuple parameters as expected by the contract
                const args = [dashboard.appId, versionTools];
                
                try {
                    setStatusMessage({ message: "Estimating gas...", type: "info" });
                    const gasLimit = await estimateGasWithBuffer(
                        contract,
                        'registerNextAppVersion',
                        args
                    );
                    
                    setStatusMessage({ message: "Sending transaction...", type: "info" });
                    const tx = await contract.registerNextAppVersion(
                        ...args,
                        {gasLimit}
                    );

                    setStatusMessage({ message: "Waiting for confirmation...", type: "info" });
                    await tx.wait(1);
                    setStatusMessage({ message: "Transaction confirmed!", type: "success" });
                    
                    setStatusMessage({ message: "New version published successfully!", type: "success" });
                    setTimeout(() => {
                        setStatusMessage(null);
                        onBack();
                    }, 2000);
                } catch (txError: any) {
                    console.error("Transaction failed:", txError);
                    setStatusMessage({ message: "Transaction failed: " + txError.message, type: "error" });
                }
            } catch (error: any) {
                console.error("Error saving tool policies:", error);
                setStatusMessage(null);
                let errorMessage = "Failed to save tool policies: ";
                
                if (error.message) {
                    errorMessage += error.message;
                } else {
                    errorMessage += "Unknown error";
                }
                
                showError(errorMessage);
            } finally {
                setIsSubmitting(false);
            }
        } catch (error: any) {
            console.error("Error saving tool policies:", error);
            setStatusMessage(null);
            let errorMessage = "Failed to save tool policies: ";
            
            if (error.message) {
                errorMessage += error.message;
            } else {
                errorMessage += "Unknown error";
            }
            
            showError(errorMessage);
            setIsSubmitting(false);
        }
    }

    // Simple loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="space-y-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="text-sm text-gray-600">Loading tool policies...</p>
                </div>
            </div>
        );
    }

    // Pre-calculate all the pieces at once
    let allTools = [];
    for (const tool of toolPolicies) {
        let allPolicies = [];
        for (const policy of tool.policies) {
            let allParameters = [];
            for (const param of policy.parameters) {
                allParameters.push(
                    <div key={param._id} className="flex gap-2 items-start mb-2">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                            <LazyInput
                                initialValue={param.name}
                                placeholder="Parameter Name"
                                onUpdate={(value) => handleUpdateParameter(tool._id, policy._id, param._id, "name", value)}
                            />
                            <LazySelect
                                initialValue={param.type}
                                onUpdate={(value) => handleUpdateParameter(tool._id, policy._id, param._id, "type", value)}
                            />
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveParameter(tool._id, policy._id, param._id)}
                            className="text-white"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                );
            }
            
            const parametersList = policy.parameters.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-2">
                    No parameters defined. Click &quot;Add Parameter&quot; to create one.
                </div>
            ) : (
                <div className="pl-4 space-y-2">
                    {allParameters}
                </div>
            );
            
            allPolicies.push(
                <div key={policy._id} className="p-4 border rounded-lg mb-4">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 mb-4">
                            <LazyInput
                                initialValue={policy.policyIpfsCid}
                                placeholder="Policy IPFS CID"
                                onUpdate={(value) => handleUpdatePolicy(tool._id, policy._id, "policyIpfsCid", value)}
                            />
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemovePolicy(tool._id, policy._id)}
                            className="text-white"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-semibold text-black">Parameters</h4>
                            <Button 
                                variant="default" 
                                size="sm" 
                                onClick={() => handleAddParameter(tool._id, policy._id)}
                                className="text-black"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Parameter
                            </Button>
                        </div>
                        {parametersList}
                    </div>
                </div>
            );
        }
        
        const policiesList = tool.policies.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-2">
                No policies defined. Click &quot;Add Policy&quot; to create one.
            </div>
        ) : (
            <div className="pl-4 space-y-4">
                {allPolicies}
            </div>
        );
        
        allTools.push(
            <div key={tool._id} className="p-4 border rounded-lg mb-4">
                <div className="flex justify-between items-start">
                    <div className="grid grid-cols-1 gap-2 flex-1 mb-4">
                        <LazyInput
                            initialValue={tool.toolIpfsCid || ""}
                            placeholder="Tool IPFS CID"
                            onUpdate={(value) => handleUpdateTool(tool._id, "toolIpfsCid", value)}
                        />
                    </div>
                    {toolPolicies.length > 1 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveTool(tool._id)}
                            className="text-white"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold text-black">Policies</h4>
                        <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => handleAddPolicy(tool._id)}
                            className="text-black"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Policy
                        </Button>
                    </div>
                    {policiesList}
                </div>
            </div>
        );
    }
    
    const toolsList = toolPolicies.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
            No tool policies added. Add a tool policy to get started.
        </div>
    ) : (
        <div className="space-y-6">
            {allTools}
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="default" size="sm" onClick={onBack} className="text-black">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold">Tools and Policies</h1>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center">
                            Tool and Policy Management
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="ml-2 px-2 py-0" 
                                title="Define tools and their parameters. Each tool can have multiple policies with different parameters."
                                onClick={() => window.open('https://docs.heyvincent.ai/Developers/Custom-Tools', '_blank')}
                            >
                                <Info className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button onClick={handleAddTool} size="sm" className="text-black">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Tool
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {toolsList}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSaveToolPolicies} disabled={isSubmitting} className="text-black">
                    {isSubmitting ? "Publishing..." : "Publish New Version"}
                </Button>
            </div>

            {statusMessage && <StatusMessage message={statusMessage.message} type={statusMessage.type} />}
        </div>
    );
}