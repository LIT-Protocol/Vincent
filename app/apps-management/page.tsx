"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { VincentApp } from "@/types/vincent"
import { ArrowRight } from "lucide-react"
import AppManager from "@/components/app-management/AppManager"

export default function AppsManagement() {
  const [apps, setApps] = useState<VincentApp[]>([])
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)

  useEffect(() => {
    // Mock data - replace with actual API call
    setApps([
      {
        id: "1",
        appName: "Sample App 1",
        description: "This is a sample application with full integration capabilities",
        status: "enabled",
        appManager: "0x1234...5678",
        managerDelegatees: ["0xabcd...efgh"],
        appId: 1,
        allowedTools: ["QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv"],
        supportEmail: "support@sample1.com",
        discordLink: "https://discord.gg/sample1",
        githubLink: "https://github.com/sample1",
        websiteUrl: "https://sample1.com"
      },
      {
        id: "2",
        appName: "Sample App 2",
        description: "Another sample application with basic features",
        status: "disabled",
        appManager: "0x8765...4321",
        managerDelegatees: [],
        appId: 2,
        allowedTools: ["QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv"],
        supportEmail: "support@sample2.com",
        githubLink: "https://github.com/sample2",
      }
    ])
  }, [])

  if (selectedAppId) {
    return <AppManager appId={selectedAppId} onBack={() => setSelectedAppId(null)} />
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Apps</h1>
      </div>

      {apps.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Apps Found</CardTitle>
            <CardDescription>
              You haven't created any Vincent applications yet.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {apps.map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{app.appName}</CardTitle>
                    <CardDescription className="mt-2">{app.description}</CardDescription>
                  </div>
                  <Badge variant={app.status === "enabled" ? "default" : "secondary"}>
                    {app.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm">
                    <span className="font-medium">App ID:</span> {app.appId}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Manager:</span> {app.appManager}
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => setSelectedAppId(app.id)}
                  >
                    Manage App <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 