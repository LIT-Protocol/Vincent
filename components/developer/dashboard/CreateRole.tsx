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

interface CreateRoleProps {
    onBack: () => void;
    dashboard?: VincentApp;
}

interface Tool {
    id: string;
    name: string;
    policy: string;
}

export default function CreateRoleScreen({ onBack, dashboard }: CreateRoleProps) {
    const [roleName, setRoleName] = useState("");
    const [tools, setTools] = useState<Tool[]>([]);

    // Mock available tools and policies - replace with actual data
    const availableTools = ["Uniswap Swap", "ERC20 Token Transfer", "Solana Token Transfer"];
    const availablePolicies = ["Max Amount", "Max Transactions"];

    const handleAddTool = () => {
        const newTool = {
            id: crypto.randomUUID(),
            name: "",
            policy: "",
        };
        setTools([...tools, newTool]);
    };

    const handleRemoveTool = (toolId: string) => {
        setTools(tools.filter(tool => tool.id !== toolId));
    };

    const updateTool = (toolId: string, field: keyof Tool, value: string) => {
        setTools(tools.map(tool => 
            tool.id === toolId ? { ...tool, [field]: value } : tool
        ));
    };

    const handleCreateRole = () => {
        // Implement role creation logic
        console.log({
            name: roleName,
            tools: tools
        });
    };

    return (
        <div className="space-y-8">
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
                                    <Select
                                        value={tool.name}
                                        onValueChange={(value) => updateTool(tool.id, "name", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Tool" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableTools.map((t) => (
                                                <SelectItem key={t} value={t}>
                                                    {t}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={tool.policy}
                                        onValueChange={(value) => updateTool(tool.id, "policy", value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Policy" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availablePolicies.map((p) => (
                                                <SelectItem key={p} value={p}>
                                                    {p}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                        disabled={!roleName || tools.length === 0}
                    >
                        Create Role
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}   