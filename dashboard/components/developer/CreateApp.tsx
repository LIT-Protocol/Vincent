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
import { useAccount } from "wagmi";
import { registerApp as registerAppApi } from "@/services/api";

// URL normalization helpers
const normalizeURL = (url: string): string => {
    if (!url) return url;
    url = url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
    }
    if (url.startsWith("http://")) {
        url = "https://" + url.slice(7);
    }
    return url;
};

const normalizeGitHubURL = (url: string): string => {
    if (!url) return url;
    url = url.trim();
    if (!url.includes("github.com") && url.includes("/")) {
        url = "https://github.com/" + url;
    }
    if (!url.includes("github.com") && !url.includes("/")) {
        url = "https://github.com/" + url;
    }
    return normalizeURL(url);
};

const formSchema = z.object({
    appName: z
        .string()
        .min(2, "App name must be at least 2 characters")
        .max(50, "App name cannot exceed 50 characters"),

    description: z
        .string()
        .min(10, "Description must be at least 10 characters")
        .max(500, "Description cannot exceed 500 characters"),

    managerDelegatees: z.array(z.string()).optional(),

    logo: z.string().optional(),

    supportEmail: z
        .string()
        .email("Please enter a valid email address")
        .optional()
        .transform((val) => val || undefined),

    githubLink: z
        .string()
        .optional()
        .transform((val) => {
            if (!val) return undefined;
            return normalizeGitHubURL(val);
        })
        .pipe(
            z
                .string()
                .url("Please enter a valid GitHub URL")
                .refine((url) => {
                    try {
                        const parsed = new URL(url);
                        return parsed.hostname === "github.com";
                    } catch {
                        return false;
                    }
                }, "Must be a GitHub URL (e.g., github.com/username/repo)")
                .optional()
        ),

    websiteUrl: z
        .string()
        .transform(normalizeURL)
        .pipe(
            z
                .string()
                .url("Please enter a valid website URL")
                .refine((url) => {
                    try {
                        const parsed = new URL(url);
                        return parsed.protocol === "https:";
                    } catch {
                        return false;
                    }
                }, "Website URL must use HTTPS")
        )
        .optional()
        .transform((val) => val || undefined),
});

export default function CreateAppScreen() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { address } = useAccount();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            appName: "",
            description: "",
            managerDelegatees: [],
            logo: "",
            supportEmail: "",
            githubLink: "",
            websiteUrl: "",
        },
        mode: "onBlur",
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!address) return;
        
        try {
            setIsSubmitting(true);
            setError(null);

            const response = await registerAppApi(address, {
                name: values.appName,
                description: values.description,
                contactEmail: values.supportEmail || "",
            });
            
            if (!response.success || !response.data?.app) {
                throw new Error(response.error || "Failed to create app");
            }
            
            if (!response.success) {
                throw new Error(response.error || "Failed to create app");
            }
            
            window.location.reload();
            
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create app");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center mb-4">
                <h1 className="text-3xl font-bold">Create New App</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Register New Vincent App</CardTitle>
                    <CardDescription>
                        Submit your application to the Vincent registry
                        <div className="mt-2 text-sm">
                            App Manager Address: <code>{address}</code>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
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
                                        name="appName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Application Name
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="My Awesome App"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Description
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describe your application..."
                                                        rows={6}
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
                                        name="supportEmail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Contact Email
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        placeholder="support@example.com"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="websiteUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Website Domain
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="example.com"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="githubLink"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    GitHub Repository (Optional)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="github.com/username/repo"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="mt-6">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? "Submitting..."
                                        : "Submit Application"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}