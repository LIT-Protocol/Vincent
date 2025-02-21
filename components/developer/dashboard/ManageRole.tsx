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
    const [error, setError] = useState<string | null>(null);

    const role = dashboard.roles.find((r) => r.roleId === roleId.toString());

    const { address } = useAccount();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            roleVersion: role!.roleVersion || "",
            roleName: role!.roleName || "",
            roleDescription: role!.roleDescription || "",
            toolPolicy: role!.toolPolicy || [],
        },
    });

    async function handleRoleUpdate(values: z.infer<typeof formSchema>) {
        if (!address) return;

        try {
            setIsSubmitting(true);
            await updateRole(address, {
                appId: dashboard.appMetadata.appId,
                roleId: roleId.toString(),
                roleVersion: values.roleVersion,
                roleName: values.roleName,
                roleDescription: values.roleDescription,
                toolPolicy: values.toolPolicy,
            });
            toast.success("Role updated successfully");
            form.reset();
        } catch (error) {
            toast.error("Failed to update role");
            setError("Failed to update role");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex-1 h-screen">
            <ScrollArea className="h-full">
                <div className="space-y-8 p-8">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={onBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-3xl font-bold">
                            {role?.roleName}
                        </h1>
                        <Badge
                            variant={role?.enabled ? "default" : "secondary"}
                        >
                            {role?.enabled ? "Enabled" : "Disabled"}
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
                                    <code>
                                        {dashboard.appMetadata.appId}
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
                                                            <Input
                                                                {...field}
                                                            />
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
                                                                    toolCId:
                                                                        "",
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
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                Updating...
                                            </div>
                                        ) : (
                                            "Update Role"
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
