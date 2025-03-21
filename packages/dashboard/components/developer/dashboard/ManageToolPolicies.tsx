"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { VincentApp, ToolPolicy, PolicyParamSchema } from "@/services/types";
import { VincentContracts } from "@/services";

interface ToolPolicyWithId extends ToolPolicy {
    _id?: string; // Frontend-only ID for mapping
    policyVarsSchema: PolicyParamSchemaWithId[];
}

interface PolicyParamSchemaWithId extends PolicyParamSchema {
    _id?: string; // Frontend-only ID for mapping
}

interface ToolPolicyManagerProps {
    onBack: () => void;
    dashboard: VincentApp;
}

export default function ManageToolPoliciesScreen({
    onBack,
    dashboard,
}: ToolPolicyManagerProps) {
    const [toolPolicies, setToolPolicies] = useState<ToolPolicyWithId[]>(
        (dashboard.toolPolicies || []).map(policy => ({
            ...policy,
            _id: crypto.randomUUID(),
            policyVarsSchema: policy.policyVarsSchema.map(schema => ({
                ...schema,
                _id: crypto.randomUUID()
            }))
        }))
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (dashboard && dashboard.toolPolicies) {
            setToolPolicies((dashboard.toolPolicies || []).map(policy => ({
                ...policy,
                _id: crypto.randomUUID(),
                policyVarsSchema: policy.policyVarsSchema.map(schema => ({
                    ...schema,
                    _id: crypto.randomUUID()
                }))
            })));
        }
    }, [dashboard, dashboard.toolPolicies]);

    const handleAddTool = () => {
        const newTool: ToolPolicyWithId = {
            _id: crypto.randomUUID(),
            toolIpfsCid: "",
            description: "",
            policyVarsSchema: [{
                _id: crypto.randomUUID(),
                paramName: "",
                valueType: "",
                defaultValue: ""
            } as PolicyParamSchemaWithId]
        };
        setToolPolicies([...toolPolicies, newTool]);
    };

    const handleAddPolicyVar = (toolId: string) => {
        setToolPolicies(toolPolicies.map(tool => {
            if (tool._id === toolId) {
                return {
                    ...tool,
                    policyVarsSchema: [...tool.policyVarsSchema, {
                        _id: crypto.randomUUID(),
                        paramName: "",
                        valueType: "",
                        defaultValue: ""
                    } as PolicyParamSchemaWithId]
                };
            }
            return tool;
        }));
    };

    const updatePolicyVar = (toolId: string, varId: string, field: keyof PolicyParamSchemaWithId, value: string) => {
        setToolPolicies(toolPolicies.map(tool => {
            if (tool._id === toolId) {
                return {
                    ...tool,
                    policyVarsSchema: tool.policyVarsSchema.map(pVar => 
                        pVar._id === varId ? { ...pVar, [field]: value } : pVar
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
                tool.policyVarsSchema.map(schema => schema.defaultValue)
            );
            const toolPolicyParameterNames = toolPolicies.map(tool => 
                tool.policyVarsSchema.map(schema => [schema.paramName])
            );

            await contracts.registerNextAppVersion(
                dashboard.appId,
                toolIpfsCids,
                toolPoliciesData,
                toolPolicyParameterNames
            );

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
                                    <Input
                                        placeholder="Description"
                                        value={tool.description}
                                        onChange={(e) => updateTool(tool._id!, "description", e.target.value)}
                                    />

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium">Policy Variables</h4>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleAddPolicyVar(tool._id!)}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Variable
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {tool.policyVarsSchema.map((pVar) => (
                                                <div key={pVar._id} className="grid grid-cols-3 gap-2">
                                                    <Input
                                                        placeholder="Parameter Name"
                                                        value={pVar.paramName}
                                                        onChange={(e) => updatePolicyVar(tool._id!, pVar._id!, "paramName", e.target.value)}
                                                    />
                                                    <Input
                                                        placeholder="Value Type"
                                                        value={pVar.valueType}
                                                        onChange={(e) => updatePolicyVar(tool._id!, pVar._id!, "valueType", e.target.value)}
                                                    />
                                                    <Input
                                                        placeholder="Default Value"
                                                        value={pVar.defaultValue}
                                                        onChange={(e) => updatePolicyVar(tool._id!, pVar._id!, "defaultValue", e.target.value)}
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