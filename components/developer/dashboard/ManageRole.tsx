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
import { removeToolPolicy, addToolPolicy } from "@/services/contract";
import { updateRole } from "@/services/api";
import { useAccount } from "wagmi";

const formSchema = z.object({
    roleVersion: z.string().min(1, "Role version is required"),

    roleName: z
        .string()
        .min(2, "Role name must be at least 2 characters")
        .max(50, "Role name cannot exceed 50 characters"),

    roleDescription: z
        .string()
        .min(10, "Description must be at least 10 characters")
        .max(500, "Description cannot exceed 500 characters"),

    toolPolicy: z.array(
        z.object({
            toolCId: z.string().min(1, "Tool CID is required"),
            policyCId: z.string().min(1, "Policy CID is required"),
        })
    ),
});

interface ManageRoleScreenProps {
    onBack: () => void;
    dashboard: VincentApp;
    roleId: number;
}

export default function ManageRoleScreen({
    onBack,
    dashboard,
    roleId,
}: ManageRoleScreenProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const role = dashboard.roles.find((r) => r.roleId === roleId.toString());

    const { address } = useAccount();

    if (!role) {
        return <div>Role not found</div>;
    }

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            roleVersion: role.roleVersion || "",
            roleName: role.roleName || "",
            roleDescription: role.roleDescription || "",
            toolPolicy: role.toolPolicy || [],
        },
    });

    async function handleUpdateRoleMetadata(
        values: z.infer<typeof formSchema>
    ) {
        try {
            setIsSubmitting(true);
            setError(null);
            setIsLoading(true);

            if (!address) {
                throw new Error("No wallet connected");
            }

            // Send to your API
            const response = await updateRole({
                address: address.toString(),
                appId: dashboard.appMetadata.appId,
                roleId: roleId.toString(),
                ...values,
            });

            if (!response.success) {
                throw new Error(response.error || "Failed to update role");
            }

            setIsSuccess(true);
        } catch (error) {
            console.error("Error submitting form:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "An error occurred while updating the role"
            );
        } finally {
            setIsSubmitting(false);
            setIsLoading(false);
        }
    }

    const handleAddToolPolicy = async (
        toolCId: string,
        policyCId: string
    ) => {};

    const handleRemoveToolPolicy = async (
        toolCId: string,
        policyCId: string
    ) => {
        try {
            setIsLoading(true);
            setError(null);

            // Call contract function
            await removeToolPolicy(roleId.toString(), toolCId, policyCId);

            // Create updated tool-policy array
            const updatedRole = {
                ...role,
                toolPolicy: role.toolPolicy.filter(
                    (tp) =>
                        !(tp.toolCId === toolCId && tp.policyCId === policyCId)
                ),
            };

            if (!address) {
                throw new Error("No wallet connected");
            }

            // Call API to update role
            await updateRole({
                address: address.toString(),
                appId: dashboard.appMetadata.appId,
                roleId: roleId.toString(),
                roleVersion: role.roleVersion,
                roleName: role.roleName,
                roleDescription: role.roleDescription,
                toolPolicy: updatedRole.toolPolicy,
            });

            // Update local ui state
            dashboard.roles = dashboard.roles.map((r) =>
                r.roleId === roleId.toString() ? updatedRole : r
            );
        } catch (error) {
            console.error("Error removing tool policy:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "An error occurred while removing the tool policy"
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Role Updated Successfully!</CardTitle>
                    <CardDescription>
                        The role has been updated in the registry.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                        </div>
                    ) : (
                        <Button
                            onClick={() => {
                                setIsSuccess(false);
                                setError(null);
                                form.reset();
                            }}
                        >
                            Update Another Role
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="flex-1 h-screen">
            {isLoading ? (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
            ) : (
                <ScrollArea className="h-full">
                    <div className="space-y-8 p-8">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" onClick={onBack}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <h1 className="text-3xl font-bold">{role.roleName}</h1>
                            <Badge variant={role.enabled ? "default" : "secondary"}>
                                {role.enabled ? "Enabled" : "Disabled"}
                            </Badge>
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
                                        <code>{dashboard.appMetadata.appId}</code> |
                                        Role ID: <code>{roleId}</code>
                                    </div>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form
                                        onSubmit={form.handleSubmit(
                                            handleUpdateRoleMetadata
                                        )}
                                        className="space-y-8"
                                    >
                                        {error && (
                                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                                                {error}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-6">
                                                <FormField
                                                    control={form.control}
                                                    name="roleVersion"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Role Version
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="roleName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Role Name
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input {...field} />
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

                                        <Card>
                                            <CardHeader>
                                                <CardTitle>
                                                    Tool-Policy Pairs
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {form
                                                        .watch("toolPolicy")
                                                        .map((_, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex gap-4 items-start"
                                                            >
                                                                <div className="flex-1 space-y-4">
                                                                    <FormField
                                                                        control={
                                                                            form.control
                                                                        }
                                                                        name={`toolPolicy.${index}.toolCId`}
                                                                        render={({
                                                                            field,
                                                                        }) => (
                                                                            <FormItem>
                                                                                <FormLabel>
                                                                                    Tool
                                                                                    CID
                                                                                </FormLabel>
                                                                                <FormControl>
                                                                                    <Input
                                                                                        {...field}
                                                                                        placeholder="Enter Tool CID"
                                                                                    />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                    <FormField
                                                                        control={
                                                                            form.control
                                                                        }
                                                                        name={`toolPolicy.${index}.policyCId`}
                                                                        render={({
                                                                            field,
                                                                        }) => (
                                                                            <FormItem>
                                                                                <FormLabel>
                                                                                    Policy
                                                                                    CID
                                                                                </FormLabel>
                                                                                <FormControl>
                                                                                    <Input
                                                                                        {...field}
                                                                                        placeholder="Enter Policy CID"
                                                                                    />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        const currentToolPolicy =
                                                                            form.getValues(
                                                                                "toolPolicy"
                                                                            );
                                                                        form.setValue(
                                                                            "toolPolicy",
                                                                            currentToolPolicy.filter(
                                                                                (
                                                                                    _,
                                                                                    i
                                                                                ) =>
                                                                                    i !==
                                                                                    index
                                                                            )
                                                                        );
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}

                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => {
                                                            const currentToolPolicy =
                                                                form.getValues(
                                                                    "toolPolicy"
                                                                );
                                                            form.setValue(
                                                                "toolPolicy",
                                                                [
                                                                    ...currentToolPolicy,
                                                                    {
                                                                        toolCId: "",
                                                                        policyCId:
                                                                            "",
                                                                    },
                                                                ]
                                                            );
                                                        }}
                                                        className="w-full"
                                                    >
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Add Tool-Policy Pair
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting
                                                ? "Updating..."
                                                : "Update Role"}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}
