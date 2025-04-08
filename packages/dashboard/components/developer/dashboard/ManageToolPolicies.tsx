"use client";

import { useState, useEffect, useMemo } from "react";
import { AppView } from "@/services/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useErrorPopup } from "@/providers/error-popup";
import { mapTypeToEnum } from "@/services/types";
import { mapEnumToTypeName, ParameterType } from "@/services/types";
import { createDatilChainManager } from '@lit-protocol/vincent-contracts';
import { useWalletClient } from 'wagmi';

interface PolicyParameter {
    name: string;
    type: string;
}

interface Policy {
    policyIpfsCid: string;
    parameters: PolicyParameter[];
}

interface ToolPolicy {
    toolIpfsCid?: string;
    policies?: Policy[];
    [key: string]: any;
}

interface PolicyParameterWithId extends PolicyParameter {
    _id: string;
}

interface PolicyWithId extends Policy {
    _id: string;
    parameters: PolicyParameterWithId[];
}

interface ToolPolicyWithId extends ToolPolicy {
    _id: string;
    policies: PolicyWithId[];
}

interface ToolPolicyManagerProps {
    onBack: () => void;
    dashboard: AppView;
}

const StatusMessage = ({ message, type = 'info' }: { message: string, type?: 'info' | 'warning' | 'success' | 'error' }) => {
  if (!message) return null;
  
  const getStatusClass = () => {
    switch (type) {
      case 'warning': return 'status-message--warning';
      case 'success': return 'status-message--success';
      case 'error': return 'status-message--error';
      default: return 'status-message--info';
    }
  };
  
  return (
    <div className={`status-message ${getStatusClass()}`}>
      {type === 'info' && <div className="spinner"></div>}
      <span>{message}</span>
    </div>
  );
};

export default function ManageToolPoliciesScreen({
    onBack,
    dashboard,
}: ToolPolicyManagerProps) {
    const [toolPolicies, setToolPolicies] = useState<ToolPolicyWithId[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ message: string; type: 'info' | 'warning' | 'success' | 'error' } | null>(null);
    const { showError } = useErrorPopup();
    const [isFetching, setIsFetching] = useState(false);
    const [shouldNavigateBack, setShouldNavigateBack] = useState(false);

    const { data: walletClient } = useWalletClient();
    
    const chainManager = useMemo(() => {
        if (!walletClient) return null;
        
        return createDatilChainManager({
            account: walletClient,
            network: 'datil',
        });
    }, [walletClient]);

    const [isHydrated, setIsHydrated] = useState(false);
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (dashboard?.appId && !isFetching && chainManager && isHydrated) {
            fetchAppVersion();
        }
    }, [dashboard?.appId, chainManager, isHydrated]);

    useEffect(() => {
        if (shouldNavigateBack) {
            onBack();
        }
    }, [shouldNavigateBack, onBack]);

    const fetchAppVersion = async () => {
        if (!dashboard?.appId || !chainManager) {
            console.error("Chain manager not found");
            setToolPolicies([createEmptyToolPolicy()]);
            setIsLoading(false);
            setIsFetching(false);
            return;
        }
        
        setIsFetching(true);

        try {
            // Use the chainManager API with type assertion to avoid type errors
            const appVersion = await chainManager.vincentApi.userDashboard.getAppVersion({
                appId: BigInt(dashboard.appId),
                version: BigInt(dashboard.currentVersion)
            }) as any;
            
            console.log("Fetched app version using chainManager:", appVersion);
            
            // Define toolsData to avoid readonly array issues
            const versionData = appVersion[1] as any;
            let toolsData: any[] = Array.from(versionData.tools as any[]);
            
            const formattedTools = toolsData.map((tool: any) => {
                let toolIpfsCid = "";
                let rawPolicies = [];
                let parameterNames = [];
                let parameterTypes = [];
                
                if (Array.isArray(tool)) {
                    toolIpfsCid = tool[0] || "";
                    
                    if (tool.length > 1 && Array.isArray(tool[1])) {
                        rawPolicies = tool[1] || [];
                    }
                    
                    if (tool.length > 2 && Array.isArray(tool[2])) {
                        parameterNames = tool[2];
                    }
                    
                    if (tool.length > 3 && Array.isArray(tool[3])) {
                        parameterTypes = tool[3];
                    }
                    
                    console.log("Processing array tool:", { 
                        toolIpfsCid, 
                        policiesLength: rawPolicies.length,
                        parameterNames,
                        parameterTypes
                    });
                } else if (typeof tool === 'object') {
                    toolIpfsCid = tool.toolIpfsCid || "";
                    rawPolicies = tool.policies || [];
                    parameterNames = tool.parameterNames || [];
                    parameterTypes = tool.parameterTypes || [];
                    console.log("Processing object tool:", { 
                        toolIpfsCid, 
                        policiesLength: rawPolicies.length,
                        parameterNames,
                        parameterTypes
                    });
                }
                
                const formattedTool: ToolPolicyWithId = {
                    _id: crypto.randomUUID(),
                    toolIpfsCid: toolIpfsCid,
                    policies: []
                };
                
                if (rawPolicies && rawPolicies.length > 0) {
                    console.log("Processing rawPolicies:", rawPolicies);
                    
                    rawPolicies.forEach((policyData: any) => {
                        let policyIpfsCid = "";
                        let policyParamNames: string[] = [];
                        let policyParamTypes: number[] = [];
                        
                        if (Array.isArray(policyData)) {
                            policyIpfsCid = policyData[0] || '';
                            policyParamNames = Array.isArray(policyData[1]) ? policyData[1] : [];
                            policyParamTypes = Array.isArray(policyData[2]) ? policyData[2] : [];
                        } else if (typeof policyData === 'object') {
                            policyIpfsCid = policyData.policyIpfsCid || '';
                            policyParamNames = policyData.parameterNames || [];
                            policyParamTypes = policyData.parameterTypes || [];
                        }
                        
                        const policy: PolicyWithId = {
                            _id: crypto.randomUUID(),
                            policyIpfsCid: policyIpfsCid,
                            parameters: []
                        };
                        
                        if (policyParamNames && policyParamNames.length > 0) {
                            policyParamNames.forEach((name: string, index: number) => {
                                const typeValue = policyParamTypes[index] !== undefined ? 
                                    policyParamTypes[index] : 
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
                else if (parameterNames && parameterNames.length > 0 && parameterTypes && parameterTypes.length > 0) {
                    console.log("Processing direct parameters:", { parameterNames, parameterTypes });
                    
                    const policy: PolicyWithId = {
                        _id: crypto.randomUUID(),
                        policyIpfsCid: "",
                        parameters: []
                    };
                    
                    parameterNames.forEach((name: string, index: number) => {
                        const typeValue = parameterTypes[index] !== undefined ? 
                            parameterTypes[index] : 
                            ParameterType.STRING;
                        
                        const typeName = mapEnumToTypeName(Number(typeValue)) || "string";
                        
                        policy.parameters.push({
                            _id: crypto.randomUUID(),
                            name: name,
                            type: typeName
                        });
                    });
                    
                    formattedTool.policies.push(policy);
                }
                
                return formattedTool;
            });
            
            const validTools = formattedTools.filter((tool: ToolPolicyWithId) => !!tool.toolIpfsCid);
            console.log("Formatted tools:", validTools);
            
            if (validTools.length === 0) {
                validTools.push(createEmptyToolPolicy());
            }
            
            setToolPolicies(validTools);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching app version:", error);
            setToolPolicies([createEmptyToolPolicy()]);
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

    const handleAddTool = () => {
        setToolPolicies([...toolPolicies, createEmptyToolPolicy()]);
    };

    const handleRemoveTool = (toolId: string) => {
        setToolPolicies(prev => {
            if (prev.length <= 1) {
                return prev;
            }
            return prev.filter(tool => tool._id !== toolId);
        });
    };

    const handleToolChange = (toolId: string, field: string, value: string) => {
        setToolPolicies(prev => 
            prev.map(tool => 
                tool._id === toolId 
                    ? { ...tool, [field]: value } 
                    : tool
            )
        );
    };

    const handleAddPolicy = (toolId: string) => {
        setToolPolicies(prev => 
            prev.map(tool => 
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
            )
        );
    };

    const handleRemovePolicy = (toolId: string, policyId: string) => {
        setToolPolicies(prev => 
            prev.map(tool => 
                tool._id === toolId 
                    ? {
                        ...tool,
                        policies: tool.policies.filter(policy => policy._id !== policyId)
                    } 
                    : tool
            )
        );
    };

    const handlePolicyChange = (toolId: string, policyId: string, field: string, value: string) => {
        setToolPolicies(prev => 
            prev.map(tool => 
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
            )
        );
    };

    const handleAddParameter = (toolId: string, policyId: string) => {
        setToolPolicies(prev => 
            prev.map(tool => 
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
            )
        );
    };

    const handleRemoveParameter = (toolId: string, policyId: string, parameterId: string) => {
        setToolPolicies(prev => 
            prev.map(tool => 
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
            )
        );
    };

    const handleParameterChange = (toolId: string, policyId: string, parameterId: string, field: string, value: string) => {
        setToolPolicies(prev => 
            prev.map(tool => 
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
            )
        );
    };

    async function handleSaveToolPolicies() {
        if (!chainManager) {
            showError("Wallet connection required to publish a new version");
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            const validTools = toolPolicies.filter(tool => !!tool.toolIpfsCid);
            
            // 1. Format the tools according to the contract expected format
            const toolsFormatted = validTools.map(tool => {
                // 2. Format the policies according to the contract expected format
                const policies = tool.policies
                    .filter(policy => !!policy.policyIpfsCid)
                    .map(policy => {
                        // 3. Format the parameters according to the contract expected format
                        const paramNames = policy.parameters
                            .filter(param => !!param.name && param.name.trim() !== '')
                            .map(param => param.name.trim());
                            
                        const paramTypes = policy.parameters
                            .filter(param => !!param.name && param.name.trim() !== '')
                            .map(param => mapTypeToEnum(param.type || "string"));
                            
                        return [
                            policy.policyIpfsCid,
                            paramNames,
                            paramTypes
                        ];
                    });
                
                return [
                    tool.toolIpfsCid,
                    policies
                ];
            });
            
            // Validation
            if (toolsFormatted.length === 0) {
                showError("Please add at least one valid tool with an IPFS CID");
                setIsSubmitting(false);
                return;
            }
            
            setStatusMessage({ message: "Sending transaction with chainManager...", type: "info" });
            
            // Extract the needed arrays from toolsFormatted with proper type casting for the chainManager API
            const toolIpfsCids = toolsFormatted.map(tool => tool[0] as string);
            const policyArray = toolsFormatted.map(tool => {
                const policies = tool[1];
                return Array.isArray(policies) ? policies.map(policy => policy[0] as string) : [];
            });
            const parameterNames = toolsFormatted.map(tool => {
                const policies = tool[1];
                return Array.isArray(policies) ? policies.map(policy => policy[1] as string[]) : [];
            });
            const parameterTypes = toolsFormatted.map(tool => {
                const policies = tool[1];
                return Array.isArray(policies) ? policies.map(policy => {
                    const types = policy[2];
                        return Array.isArray(types) ? types.map(type => {
                            let typeName = mapEnumToTypeName(type as number).toUpperCase();
                        
                        // Fix array type format - convert "TYPE[]" to "TYPE_ARRAY"
                        if (typeName.endsWith('[]')) {
                            typeName = typeName.replace('[]', '_ARRAY');
                        }
                        
                        // Use type assertion to match the expected string literals
                        return typeName as "STRING" | "STRING_ARRAY" | "BOOL" | "BOOL_ARRAY" |
                            "UINT256" | "UINT256_ARRAY" | "INT256" | "INT256_ARRAY" |
                            "ADDRESS" | "ADDRESS_ARRAY" | "BYTES" | "BYTES_ARRAY";
                    }) : [];
                }) : [];
            });
            
            try {
                const result = await chainManager.vincentApi.appManagerDashboard.registerNextAppVersion({
                    appId: BigInt(dashboard.appId),
                    toolIpfsCids,
                    toolPolicies: policyArray,
                    toolPolicyParameterNames: parameterNames,
                    toolPolicyParameterTypes: parameterTypes
                });
                
                setStatusMessage({ message: "Waiting for confirmation...", type: "info" });
                await result.receipt;
                
                setStatusMessage({ message: "New version published successfully!", type: "success" });
                
                // Separate the success UI from navigation to avoid hydration issues
                const completeAfterDelay = () => {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            setStatusMessage(null);
                            resolve(true);
                        }, 2000);
                    });
                };
                
                completeAfterDelay().then(() => {
                    // Handle navigation in a separate tick
                    requestAnimationFrame(() => {
                        setShouldNavigateBack(true);
                    });
                });
            } catch (error: any) {
                console.error("Transaction failed:", error);
                setStatusMessage(null);
                
                let errorMsg = error.message || "Unknown transaction error";
                showError(`Transaction failed: ${errorMsg}`);
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
    }

    const renderParameter = (tool: ToolPolicyWithId, policy: PolicyWithId, parameter: PolicyParameterWithId) => {
        return (
            <div key={parameter._id} className="flex gap-2 items-start mb-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                        placeholder="Parameter Name"
                        value={parameter.name}
                        onChange={(e) => handleParameterChange(
                            tool._id, policy._id, parameter._id, "name", e.target.value
                        )}
                    />
                    <Select
                        value={parameter.type}
                        onValueChange={(value) => handleParameterChange(
                            tool._id, policy._id, parameter._id, "type", value
                        )}
                    >
                        <SelectTrigger className="text-black">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="string">string</SelectItem>
                            <SelectItem value="string[]">string[]</SelectItem>
                            <SelectItem value="bool">bool</SelectItem>
                            <SelectItem value="bool[]">bool[]</SelectItem>
                            <SelectItem value="uint256">uint256</SelectItem>
                            <SelectItem value="uint256[]">uint256[]</SelectItem>
                            <SelectItem value="int256">int256</SelectItem>
                            <SelectItem value="int256[]">int256[]</SelectItem>
                            <SelectItem value="address">address</SelectItem>
                            <SelectItem value="address[]">address[]</SelectItem>
                            <SelectItem value="bytes">bytes</SelectItem>
                            <SelectItem value="bytes[]">bytes[]</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveParameter(tool._id, policy._id, parameter._id)}
                    className="text-white"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        );
    };

    const renderPolicy = (tool: ToolPolicyWithId, policy: PolicyWithId) => {
        return (
            <div key={policy._id} className="p-4 border rounded-lg mb-4">
                <div className="flex justify-between items-start">
                    <div className="flex-1 mb-4">
                        <Input
                            placeholder="Policy IPFS CID"
                            value={policy.policyIpfsCid}
                            onChange={(e) => handlePolicyChange(tool._id, policy._id, "policyIpfsCid", e.target.value)}
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
                    <div className="pl-4 space-y-2">
                        {policy.parameters.map((parameter) => 
                            renderParameter(tool, policy, parameter)
                        )}
                        
                        {policy.parameters.length === 0 && (
                            <div className="text-center text-sm text-gray-500 py-2">
                                No parameters defined. Click &quot;Add Parameter&quot; to create one.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderTool = (tool: ToolPolicyWithId) => {
        if (!tool) return null;
        
        return (
            <div key={tool._id} className="p-4 border rounded-lg mb-4">
                <div className="flex justify-between items-start">
                    <div className="grid grid-cols-1 gap-2 flex-1 mb-4">
                        <Input
                            placeholder="Tool IPFS CID"
                            value={tool.toolIpfsCid || ""}
                            onChange={(e) => handleToolChange(tool._id, "toolIpfsCid", e.target.value)}
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
                    <div className="pl-4 space-y-4">
                        {tool.policies.map((policy) => 
                            renderPolicy(tool, policy)
                        )}
                        
                        {tool.policies.length === 0 && (
                            <div className="text-center text-sm text-gray-500 py-2">
                                No policies defined. Click &quot;Add Policy&quot; to create one.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

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

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="default" size="sm" onClick={onBack} className="text-black">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold">Tool Policies</h1>
                </div>
                <Button onClick={handleAddTool} className="text-black">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tool Policy
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        Tool Policies
                        <Button variant="ghost" size="sm" className="ml-2 px-2 py-0" title="Define tools and their parameters. Each tool can have multiple policies with different parameters.">
                            <Info className="h-4 w-4" />
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {toolPolicies.map((tool) => renderTool(tool))}

                        {toolPolicies.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                No tool policies added. Add a tool policy to get started.
                            </div>
                        )}
                    </div>
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