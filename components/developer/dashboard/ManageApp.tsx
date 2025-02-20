"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { AppMetadata } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { ArrowLeft } from "lucide-react"
import { VincentApp } from "@/types"
import { useSignMessage } from "wagmi"
import { useAccount } from "wagmi"
import { SiweMessage } from "siwe"

const formSchema = z.object({
  appName: z.string().min(2, "App name must be at least 2 characters").max(50, "App name cannot exceed 50 characters"),
  appDescription: z.string().min(10, "Description must be at least 10 characters").max(500, "Description cannot exceed 500 characters"),
  email: z.string().email("Must be a valid email address"),
  domain: z.string().url("Must be a valid URL").optional(),
})

interface AppManagerProps {
  onBack: () => void;
  dashboard?: VincentApp;
}

export default function ManageAppScreen({ onBack, dashboard }: AppManagerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signMessageAsync } = useSignMessage();
  const { address } = useAccount();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appName: dashboard?.appMetadata.appName || "",
      appDescription: dashboard?.appMetadata.description || "",
      email: dashboard?.appMetadata.email || "",
      domain: dashboard?.appMetadata.domain || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      setError(null);

      // Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address: address || "",
        statement: 'Sign to update app metadata',
        uri: window.location.origin,
        version: '1',
        chainId: 1, // Replace with your chain ID
        nonce: '1234', // Should be generated server-side
        resources: [JSON.stringify(values)],
      });

      const messageToSign = message.prepareMessage();
      const signature = await signMessageAsync({
        message: messageToSign,
      });

      const response = await fetch('/api/v1/updateApp', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signedMessage: signature,
          appId: dashboard?.appMetadata.appId,
          ...values
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update app');
      }

      // Show success message or redirect
    } catch (error) {
      console.error("Error updating app:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!dashboard) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Manage Application</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Update Application Info</CardTitle>
            <CardDescription>
              Update your application&apos;s off-chain information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="appName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* <FormField
                  control={form.control}
                  name="discordLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discord Link</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>GitHub Link</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>Update Application</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Badge variant={dashboard.enabled ? "default" : "secondary"}>
                    {dashboard.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="text-sm">
                  <div className="font-medium">App ID</div>
                  <div className="mt-1">{dashboard.appMetadata.appId}</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Manager Address</div>
                  <div className="mt-1 break-all">{dashboard.delegatees[0]}</div>
                </div>
                <Button variant="destructive" className="w-full">
                  Disable Application
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allowed Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboard.roles.map((role) => (
                  <div key={role.roleName} className="text-sm break-all">
                    {role.roleName}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 