"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { VincentApp } from "@/types"
import { useAccount } from "wagmi";
import { createRole } from "@/services/api";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreateRoleProps {
    onBack: () => void;
    dashboard?: VincentApp;
}

interface Tool {
    id: string;
    name: string;
    description: string;
    toolIpfsCid: string;
    policyVars: PolicyVar[];
}

interface PolicyVar {
    id: string;
    paramName: string;
    valueType: string;
    defaultValue: string;
}

export default function CreateRoleScreen({ onBack, dashboard }: CreateRoleProps) {
    const [roleName, setRoleName] = useState("");
    const [roleDescription, setRoleDescription] = useState("");
    const [tools, setTools] = useState<Tool[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Mock available tools and policies - replace with actual data
    const availableTools = ["Uniswap Swap", "ERC20 Token Transfer", "Solana Token Transfer"];
    const availablePolicies = ["Max Amount", "Max Transactions"];

    const { address } = useAccount();

    const handleAddTool = () => {
        const newTool = {
            id: crypto.randomUUID(),
            name: "",
            description: "",
            toolIpfsCid: "",
            policyVars: [{
                id: crypto.randomUUID(),
                paramName: "",
                valueType: "",
                defaultValue: ""
            }]
        };
        setTools([...tools, newTool]);
    };

    const handleAddPolicyVar = (toolId: string) => {
        setTools(tools.map(tool => {
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
        setTools(tools.map(tool => {
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
        setTools(tools.filter(tool => tool.id !== toolId));
    };

    const updateTool = (toolId: string, field: keyof Tool, value: string) => {
        setTools(tools.map(tool => 
            tool.id === toolId ? { ...tool, [field]: value } : tool
        ));
    };

    async function handleCreateRole() {
        if (!address) return;

        try {
            setIsLoading(true);
            await createRole(address, {
                name: roleName,
                description: roleDescription,
                managementWallet: address,
                toolPolicy: tools.map(tool => ({
                    toolIpfsCid: tool.toolIpfsCid,
                    policyVarsSchema: tool.policyVars.map(({ paramName, valueType, defaultValue }) => ({
                        paramName,
                        valueType,
                        defaultValue
                    }))
                }))
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <ScrollArea className="h-[calc(123vh-20rem)]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold">Create New Role</h1>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Role Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Role Name</label>
                        <Input
                            placeholder="Enter role name..."
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Role Description</label>
                        <Input
                            placeholder="Enter role description..."
                            value={roleDescription}
                            onChange={(e) => setRoleDescription(e.target.value)}
                        />
                    </div>

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
                                    
                                    <Input
                                        placeholder="Tool Description"
                                        value={tool.description}
                                        onChange={(e) => updateTool(tool.id, "description", e.target.value)}
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
                                                {tool.policyVars.map((pVar, index) => (
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

                    <Button
                        className="w-full"
                        onClick={handleCreateRole}
                        disabled={!roleName || tools.length === 0 || isLoading}
                    >
                        {isLoading ? "Creating..." : "Create Role"}
                    </Button>
                </CardContent>
            </Card>
            </ScrollArea>
        </div>
    );
}   