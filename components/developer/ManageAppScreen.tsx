"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { VincentApp } from "@/types/vincent"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { ArrowLeft } from "lucide-react"

const formSchema = z.object({
  appName: z.string().min(2).max(50),
  description: z.string().min(10).max(500),
  email: z.string().email().optional(),
  domain: z.string().url().optional(),
})

interface AppManagerProps {
  onBack: () => void;
}

export default function AppManagerScreen({ onBack }: AppManagerProps) {
  const [app, setApp] = useState<VincentApp | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appName: "",
      description: "",
      email: "",
      domain: "",
    },
  })

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockApp: VincentApp = {
      appId: "1",
      appName: "Uniswap Watcher",
      description: "This is a sample application with full integration capabilities",
      enabled: true,
      roleVersion: "1",
      managerDelegatees: ["0xabcd...efgh"],
      toolPolicy: [
        {
          toolCId: "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
          policyCId: "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
        },
      ],
      appCreator: "0xabcd...efgh",
      roleIds: [1],
    }
    setApp(mockApp)
    form.reset({
      appName: mockApp.appName,
      description: mockApp.description,
      email: mockApp.email,
      domain: mockApp.domain,
    })
  }, [form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // TODO: Implement API call to update app info
      console.log(values)
    } catch (error) {
      console.error("Error updating app:", error)
    }
  }

  if (!app) {
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
                  name="description"
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

                <Button type="submit" className="w-full">Update Application</Button>
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
                  <Badge variant={app.enabled ? "default" : "secondary"}>
                    {app.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="text-sm">
                  <div className="font-medium">App ID</div>
                  <div className="mt-1">{app.appId}</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Manager Address</div>
                  <div className="mt-1 break-all">{app.managerDelegatees[0]}</div>
                </div>
                <Button variant="destructive" className="w-full">
                  Disable Application
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allowed Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {app.toolPolicy.map((tool) => (
                  <div key={tool.toolCId} className="text-sm break-all">
                    {tool.toolCId}
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