"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { VincentApp, ToolPolicy, Policy } from "@/services/types";
import { VincentContracts } from "@/services";

interface PolicyWithId extends Policy {
    _id?: string; // Frontend-only ID for mapping
}

interface ToolPolicyWithId extends ToolPolicy {
    _id?: string; // Frontend-only ID for mapping
    policies: PolicyWithId[];
}

interface ToolPolicyManagerProps {
    onBack: () => void;
    dashboard: VincentApp;
    onSuccess: () => void;
}

export default function ManageToolPoliciesScreen({
    onBack,
    dashboard,
    onSuccess,
}: ToolPolicyManagerProps) {
    const [toolPolicies, setToolPolicies] = useState<ToolPolicyWithId[]>(
        (dashboard.toolPolicies || []).map(policy => ({
            ...policy,
            _id: crypto.randomUUID(),
            policies: policy.policies.map(p => ({
                ...p,
                _id: crypto.randomUUID()
            }))
        }))
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setToolPolicies((dashboard.toolPolicies || []).map(policy => ({
            ...policy,
            _id: crypto.randomUUID(),
            policies: policy.policies.map(p => ({
                ...p,
                _id: crypto.randomUUID()
            }))
        })));
    }, [dashboard.toolPolicies]);

    const handleAddTool = () => {
        const newTool: ToolPolicyWithId = {
            _id: crypto.randomUUID(),
            toolIpfsCid: "",
            policies: [{
                _id: crypto.randomUUID(),
                policyIpfsCid: "",
                policySchemaIpfsCid: "",
                parameterNames: []
            }]
        };
        setToolPolicies([...toolPolicies, newTool]);
    };

    const handleAddPolicy = (toolId: string) => {
        setToolPolicies(toolPolicies.map(tool => {
            if (tool._id === toolId) {
                return {
                    ...tool,
                    policies: [...tool.policies, {
                        _id: crypto.randomUUID(),
                        policyIpfsCid: "",
                        policySchemaIpfsCid: "",
                        parameterNames: []
                    }]
                };
            }
            return tool;
        }));
    };

    const updatePolicy = (toolId: string, policyId: string, field: keyof Policy, value: string | string[]) => {
        setToolPolicies(toolPolicies.map(tool => {
            if (tool._id === toolId) {
                return {
                    ...tool,
                    policies: tool.policies.map(policy => 
                        policy._id === policyId ? { ...policy, [field]: value } : policy
                    )
                };
            }
            return tool;
        }));
    };

    const handleRemoveTool = (toolId: string) => {
        setToolPolicies(toolPolicies.filter(tool => tool._id !== toolId));
    };

    const updateTool = (toolId: string, field: keyof ToolPolicy, value: string) => {
        setToolPolicies(toolPolicies.map(tool => 
            tool._id === toolId ? { ...tool, [field]: value } : tool
        ));
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            const contracts = new VincentContracts('datil');
            
            // Prepare the data for the contract call
            const toolIpfsCids = toolPolicies.map(tool => tool.toolIpfsCid);
            const toolPoliciesData = toolPolicies.map(tool => 
                tool.policies.map(policy => policy.policyIpfsCid)
            );
            const toolPolicySchemaIpfsCids = toolPolicies.map(tool => 
                tool.policies.map(policy => policy.policySchemaIpfsCid)
            );
            const toolPolicyParameterNames = toolPolicies.map(tool => 
                tool.policies.map(policy => policy.parameterNames)
            );

            await contracts.registerNextAppVersion(
                dashboard.appId,
                toolIpfsCids,
                toolPoliciesData,
                toolPolicySchemaIpfsCids,
                toolPolicyParameterNames
            );

            onSuccess();
            setIsSubmitting(false);
        } catch (error) {
            console.error('Error saving tool policies:', error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold">Tool Policies</h1>
                </div>
                <Button onClick={handleAddTool}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tool Policy
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tool Policies</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {toolPolicies.map((tool) => (
                            <div
                                key={tool._id}
                                className="flex gap-4 items-start p-4 border rounded-lg"
                            >
                                <div className="flex-1 space-y-4">
                                    <Input
                                        placeholder="Tool IPFS CID"
                                        value={tool.toolIpfsCid}
                                        onChange={(e) => updateTool(tool._id!, "toolIpfsCid", e.target.value)}
                                    />

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium">Policies</h4>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleAddPolicy(tool._id!)}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Policy
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {tool.policies.map((policy) => (
                                                <div key={policy._id} className="grid grid-cols-3 gap-2">
                                                    <Input
                                                        placeholder="Policy IPFS CID"
                                                        value={policy.policyIpfsCid}
                                                        onChange={(e) => updatePolicy(tool._id!, policy._id!, "policyIpfsCid", e.target.value)}
                                                    />
                                                    <Input
                                                        placeholder="Policy Schema IPFS CID"
                                                        value={policy.policySchemaIpfsCid}
                                                        onChange={(e) => updatePolicy(tool._id!, policy._id!, "policySchemaIpfsCid", e.target.value)}
                                                    />
                                                    <Input
                                                        placeholder="Parameter Names (comma-separated)"
                                                        value={policy.parameterNames.join(',')}
                                                        onChange={(e) => updatePolicy(tool._id!, policy._id!, "parameterNames", e.target.value.split(',').map(s => s.trim()))}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRemoveTool(tool._id!)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        {toolPolicies.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                No tool policies added. Add a tool policy to get started.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </div>
    );
}