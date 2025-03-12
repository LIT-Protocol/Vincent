"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { VincentApp } from "@/types";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { updateRole, createRole } from "@/services/api";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import ToolsAndPolicies from "./ToolsAndPolicies";

const formSchema = z.object({
    roleName: z
        .string()
        .min(2, "Role name must be at least 2 characters")
        .max(50, "Role name cannot exceed 50 characters"),

    roleDescription: z
        .string(),

    toolPolicy: z.array(
        z.object({
            _id: z.string().optional(),
            toolIpfsCid: z.string().min(1, "Tool IPFS CID is required"),
            description: z.string(),
            policyVars: z.array(z.object({
                _id: z.string().optional(),
                paramName: z.string().min(1, "Policy Variable Name is required"),
                valueType: z.string().min(1, "Policy Variable Type is required"),
                defaultValue: z.string().min(1, "Policy Variable Default Value is required"),
            }))
        })
    ),
});

interface ManageRoleScreenProps {
    onBack: () => void;
    dashboard: VincentApp;
    onSuccess: () => void;
    roleId: string;
}

export default function ManageRoleScreen({
    onBack,
    dashboard,
    onSuccess,
    roleId,
}: ManageRoleScreenProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { address } = useAccount();

    // Determine if this is a new role or an existing one
    const isNewRole = roleId === "new";
    const role = isNewRole ? null : dashboard.roles.find((r) => r.roleId === roleId.toString());

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            roleName: role?.roleName || "",
            roleDescription: role?.roleDescription || "",
            toolPolicy: role?.toolPolicy?.map(tp => ({
                _id: crypto.randomUUID(),
                toolIpfsCid: tp.toolIpfsCid,
                description: "",
                policyVars: tp.policyVarsSchema.map(p => ({
                    _id: crypto.randomUUID(),
                    paramName: p.paramName,
                    valueType: p.valueType,
                    defaultValue: p.defaultValue
                }))
            })) || [],
        },
    });

    async function handleRoleUpdate(values: z.infer<typeof formSchema>) {
        if (!address) return;

        try {
            setIsSubmitting(true);
            
            if (isNewRole) {
                // Handle new role creation
                await createRole(address, {
                    name: values.roleName,
                    description: values.roleDescription,
                    managementWallet: address,
                    toolPolicy: values.toolPolicy.map((tp) => ({
                        toolIpfsCid: tp.toolIpfsCid,
                        description: tp.description || "",
                        policyVarsSchema: tp.policyVars.map((p) => ({
                            paramName: p.paramName,
                            valueType: p.valueType,
                            defaultValue: p.defaultValue,
                        })),
                    })),
                });
            } else {
                // Handle role update
                await updateRole(address, {
                    roleId: roleId,
                    name: values.roleName,
                    description: values.roleDescription,
                    toolPolicy: values.toolPolicy.map((tp) => ({
                        toolIpfsCid: tp.toolIpfsCid,
                        description: tp.description || "",
                        policyVarsSchema: tp.policyVars.map((p) => ({
                            paramName: p.paramName,
                            valueType: p.valueType,
                            defaultValue: p.defaultValue,
                        })),
                    })),
                });
            }
            onSuccess();
            // onBack();
        } catch (error) {
            const action = isNewRole ? "create" : "update";
            toast.error(`Failed to ${action} role`);
            setError(`Failed to ${action} role`);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex-1 h-screen">
            <ScrollArea className="h-[calc(123vh-20rem)]">
                <div className="space-y-8 p-8">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={onBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-3xl font-bold">
                            {role?.roleName}
                        </h1>
                        {/* <Badge
                            variant={role?.enabled ? "default" : "secondary"}
                        >
                            {role?.enabled ? "Enabled" : "Disabled"}
                        </Badge> */}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>{isNewRole ? "Create Role" : "Manage Role"}</CardTitle>
                            <CardDescription>
                                {isNewRole ? "Create a new role" : "Update role details and manage tool policies"}
                                <div className="mt-2 text-sm">
                                    Management Wallet Address:{" "}
                                    <code>{address}</code>
                                </div>
                                {!isNewRole && (
                                    <div className="mt-2 text-sm">
                                        App ID:{" "}
                                        <code>
                                            {dashboard.appMetadata.appName}
                                        </code>{" "}
                                        | Role ID: <code>{roleId}</code>
                                    </div>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleRoleUpdate)} className="space-y-8">
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                                            {error}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                                        <div className="space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="roleName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Role Name
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="roleDescription"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Role Description
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                rows={4}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <ToolsAndPolicies
                                        tools={form.watch("toolPolicy")}
                                        onToolsChange={(tools) => {
                                            form.setValue("toolPolicy", tools);
                                        }}
                                    />

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                {isNewRole ? "Creating..." : "Updating..."}
                                            </div>
                                        ) : (
                                            isNewRole ? "Create Role" : "Update Role"
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </ScrollArea>
        </div>
    );
}