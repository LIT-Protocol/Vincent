"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState } from "react"
import { SiweMessage } from 'siwe'
import { useSignMessage } from 'wagmi'

const formSchema = z.object({
  roleVersion: z.string()
    .min(1, "Role version is required"),
  
  roleName: z.string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name cannot exceed 50 characters"),
  
  roleDescription: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters"),
  
  toolPolicy: z.array(z.object({
    tool: z.object({
      ipfsCid: z.string().min(1, "Tool IPFS CID is required")
    }),
    policy: z.object({
      ipfsCid: z.string().min(1, "Policy IPFS CID is required"),
      policyVarsSchema: z.record(z.any())
    })
  }))
})

interface ManageRolesScreenProps {
  onBack: () => void;
  appId: number;
  roleId: number;
}

export default function ManageRoleScreen({ onBack, appId, roleId }: ManageRolesScreenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signMessageAsync } = useSignMessage()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roleVersion: "",
      roleName: "",
      roleDescription: "",
      toolPolicy: []
    },
  })

  const address = "0x..." // TODO: Replace with actual wallet connection logic

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)
      setError(null)
      
      // Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address: address,
        statement: 'Sign to update role',
        uri: window.location.origin,
        version: '1',
        chainId: 1, // Replace with your chain ID
        nonce: '1234', // You should generate this server-side
        // Include form data in the message
        resources: [
          JSON.stringify({
            appId,
            roleId,
            roleVersion: values.roleVersion,
            roleName: values.roleName,
            roleDescription: values.roleDescription,
            toolPolicy: values.toolPolicy
          })
        ],
      })

      // Convert the message to string
      const messageToSign = message.prepareMessage()

      // Request signature from user
      const signature = await signMessageAsync({
        message: messageToSign,
      })

      // Log the values
      console.log('Submitting form with values:', values)
      
      // Send to your API with the signed message
      const response = await fetch('/api/v1/updateRole', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signedMessage: signature,
          appId,
          roleId,
          roleVersion: values.roleVersion,
          roleName: values.roleName,
          roleDescription: values.roleDescription,
          toolPolicy: values.toolPolicy
        }),
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message || 'Failed to update role')
      }

      setIsSuccess(true)
    } catch (error) {
      console.error("Error submitting form:", error)
      setError(error instanceof Error ? error.message : "An error occurred while updating the role")
    } finally {
      setIsSubmitting(false)
    }
  }

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
          <Button
            onClick={() => {
              setIsSuccess(false)
              setError(null)
              form.reset()
            }}
          >
            Update Another Role
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center mb-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="mr-4"
        >
          ← Back
        </Button>
        <h1 className="text-3xl font-bold">Manage Roles</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Update Role</CardTitle>
          <CardDescription>
            Update an existing role in the Vincent registry
            <div className="mt-2 text-sm">
              Management Wallet Address: <code>{address}</code>
            </div>
            <div className="mt-2 text-sm">
              App ID: <code>{appId}</code> | Role ID: <code>{roleId}</code>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                        <FormLabel>Role Version</FormLabel>
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
                        <FormLabel>Role Name</FormLabel>
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
                        <FormLabel>Role Description</FormLabel>
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

              {/* TODO: Add Tool-Policy pair interface */}

              <div className="mt-6">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update Role"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
