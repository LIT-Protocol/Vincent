"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

export interface Tool {
    id: string;
    toolIpfsCid: string;
    policyVars: PolicyVar[];
}

interface PolicyVar {
    id: string;
    paramName: string;
    valueType: string;
    defaultValue: string;
}

interface ToolsAndPoliciesProps {
    tools: Tool[];
    onToolsChange: (tools: Tool[]) => void;
}

export default function ToolsAndPolicies({ tools, onToolsChange }: ToolsAndPoliciesProps) {
    console.log("tools", tools);
    const handleAddTool = () => {
        const newTool = {
            id: crypto.randomUUID(),
            toolIpfsCid: "",
            policyVars: [{
                id: crypto.randomUUID(),
                paramName: "",
                valueType: "",
                defaultValue: ""
            }]
        };
        onToolsChange([...tools, newTool]);
    };

    const handleAddPolicyVar = (toolId: string) => {
        onToolsChange(tools.map(tool => {
            if (tool.id === toolId) {
                return {
                    ...tool,
                    policyVars: [...tool.policyVars, {
                        id: crypto.randomUUID(),
                        paramName: "",
                        valueType: "",
                        defaultValue: ""
                    }]
                };
            }
            return tool;
        }));
    };

    const updatePolicyVar = (toolId: string, varId: string, field: keyof PolicyVar, value: string) => {
        onToolsChange(tools.map(tool => {
            if (tool.id === toolId) {
                return {
                    ...tool,
                    policyVars: tool.policyVars.map(pVar => 
                        pVar.id === varId ? { ...pVar, [field]: value } : pVar
                    )
                };
            }
            return tool;
        }));
    };

    const handleRemoveTool = (toolId: string) => {
        onToolsChange(tools.filter(tool => tool.id !== toolId));
    };

    const updateTool = (toolId: string, field: keyof Tool, value: string) => {
        onToolsChange(tools.map(tool => 
            tool.id === toolId ? { ...tool, [field]: value } : tool
        ));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Tools & Policies</h3>
                <Button onClick={handleAddTool}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tool
                </Button>
            </div>

            {tools.map((tool) => (
                <div
                    key={tool.id}
                    className="flex gap-4 items-start p-4 border rounded-lg"
                >
                    <div className="flex-1 space-y-4">
                        <Input
                            placeholder="Tool IPFS CID"
                            value={tool.toolIpfsCid}
                            onChange={(e) => updateTool(tool.id, "toolIpfsCid", e.target.value)}
                        />
                        

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">Policy Variables</h4>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleAddPolicyVar(tool.id)}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Variable
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {tool.policyVars.map((pVar) => (
                                    <div key={pVar.id} className="grid grid-cols-3 gap-2">
                                        <Input
                                            placeholder="Parameter Name"
                                            value={pVar.paramName}
                                            onChange={(e) => updatePolicyVar(tool.id, pVar.id, "paramName", e.target.value)}
                                        />
                                        <Input
                                            placeholder="Value Type"
                                            value={pVar.valueType}
                                            onChange={(e) => updatePolicyVar(tool.id, pVar.id, "valueType", e.target.value)}
                                        />
                                        <Input
                                            placeholder="Default Value"
                                            value={pVar.defaultValue}
                                            onChange={(e) => updatePolicyVar(tool.id, pVar.id, "defaultValue", e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveTool(tool.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}

            {tools.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                    No tools added. Add a tool to get started.
                </div>
            )}
        </div>
    );
}