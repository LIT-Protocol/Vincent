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
import ToolsAndPolicies from "./ToolsAndPolicies";

interface CreateRoleProps {
    onBack: () => void;
    dashboard?: VincentApp;
    onSuccess: () => void;
}

interface Tool {
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

export default function CreateRoleScreen({ onBack, dashboard, onSuccess  }: CreateRoleProps) {
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
            setIsLoading(false);
            onSuccess();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <ScrollArea className="h-[calc(123vh-20rem)]">
            <div className="flex items-center justify-between mb-4">
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
                        <ToolsAndPolicies 
                            tools={tools}
                            onToolsChange={setTools}
                        />

                        <Button
                            className="w-full"
                            onClick={handleCreateRole}
                            disabled={!roleName || tools.length === 0 || isLoading}
                        >
                            {isLoading ? "Creating..." : "Create Role"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            </ScrollArea>
        </div>
    );
}