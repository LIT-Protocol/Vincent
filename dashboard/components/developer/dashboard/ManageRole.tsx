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
import { updateRole } from "@/services/api";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import ToolsAndPolicies from "./ToolsAndPolicies";

const formSchema = z.object({
    // roleVersion: z.string().min(1, "Role version is required"),

    roleName: z
        .string()
        .min(2, "Role name must be at least 2 characters")
        .max(50, "Role name cannot exceed 50 characters"),

    roleDescription: z
        .string(),

    toolPolicy2: z.array(
        z.object({
            toolId: z.string().min(1, "Tool ID is required"),
            policyId: z.string().min(1, "Policy ID is required"),
        })
    ),
    toolPolicy: z.array(
        z.object({
            id: z.string().min(1, "Tool ID is required"),
            toolIpfsCid: z.string().min(1, "Tool IPFS CID is required"),
            policyVars: z.array(z.object({
                id: z.string().min(1, "Policy Variable ID is required"),
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
    roleId: string;
}

export default function ManageRoleScreen({
    onBack,
    dashboard,
    roleId,
}: ManageRoleScreenProps) {

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const role = dashboard.roles.find((r) => r.roleId === roleId.toString());

    const { address } = useAccount();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            roleName: role?.roleName,
            roleDescription: role?.roleDescription,
            toolPolicy2: role?.toolPolicy?.map(tp => ({
                toolId: tp.toolCId,
                policyVarsSchema: tp.policyVarsSchema.map(p => ({
                    paramName: p.paramName,
                    valueType: p.valueType,
                    defaultValue: p.defaultValue
                }))
            })) || [],
            toolPolicy: role?.toolPolicy?.map(tp => ({
                id: tp.toolCId,
                toolIpfsCid: tp.toolCId,
                policyVars: tp.policyVarsSchema.map(p => ({
                    paramName: p.paramName,
                    valueType: p.valueType,
                    defaultValue: p.defaultValue
                }))
            })) || [],
        },
    });

 

    async function handleRoleUpdate(values: z.infer<typeof formSchema>) {
        console.log("values", values, address);
        if (!address) return;

        try {
            setIsSubmitting(true);
          
            await updateRole(address, {
                roleId: roleId,
                name: values.roleName,
                description: values.roleDescription,
                toolPolicy: values.toolPolicy.map((tp) => ({
                    toolIpfsCid: tp.toolIpfsCid,
                    policyVarsSchema: tp.policyVars.map((p) => ({
                        paramName: p.paramName,
                        valueType: p.valueType,
                        defaultValue: p.defaultValue,
                    })),
                })),
            });
            toast.success("Role updated successfully");
            onBack();
        } catch (error) {
            toast.error("Failed to update role");
            setError("Failed to update role");
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
                            {role?.roleId}
                        </h1>
                        {/* <Badge
                            variant={role?.enabled ? "default" : "secondary"}
                        >
                            {role?.enabled ? "Enabled" : "Disabled"}
                        </Badge> */}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Role</CardTitle>
                            <CardDescription>
                                Update role details and manage tool policies
                                <div className="mt-2 text-sm">
                                    Management Wallet Address:{" "}
                                    <code>{address}</code>
                                </div>
                                <div className="mt-2 text-sm">
                                    App ID:{" "}
                                    <code>
                                        {dashboard.appMetadata.appName}
                                    </code>{" "}
                                    | Role ID: <code>{roleId}</code>
                                </div>
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
                                            {/* <FormField
                                                control={form.control}
                                                name="roleVersion"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Role Version
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            /> */}


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

                                    {/* <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                Updating...
                                            </div>
                                        ) : (
                                            "Update Role"
                                        )}
                                    </Button> */}
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </ScrollArea>
        </div>
    );
}