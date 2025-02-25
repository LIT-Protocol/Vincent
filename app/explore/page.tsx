"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { VincentApp } from "@/types"
import { ExternalLink, Github, Mail, MessageSquare } from "lucide-react"
import Image from "next/image"

export default function Explore() {
  const [apps, setApps] = useState<(VincentApp & { access: boolean })[]>([])

  useEffect(() => {
    // Mock data - replace with actual API call
    setApps([
      {
        name: "Sample App 1",
        description: "This is a sample application with full integration capabilities",
        status: "enabled",
        appManager: "0x1234...5678",
        managerDelegatees: ["0xabcd...efgh"],
        appId: 1,
        allowedTools: ["QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv", "QmaLAZCJEk5B4BW962pjENxCDHvwGtPptCamhckk9GJxJe"],
        // logo: "/sample-logo.png",
        supportEmail: "support@sample1.com",
        // discordLink: "https://discord.gg/sample1",
        githubLink: "https://github.com/sample1",
        websiteUrl: "https://sample1.com",
        access: true
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
        access: false
      }
    ])
  }, [])

  const handleUseApp = (appId: string) => {
    // Will implement actual functionality later
    console.log(`Using app ${appId}`)
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vincent Applications</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {apps.map((app) => (
          <Card key={app.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {app.logo && (
                    <Image 
                      src={app.logo} 
                      alt={`${app.appName} logo`} 
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <CardTitle>{app.appName}</CardTitle>
                    <CardDescription className="mt-2">{app.description}</CardDescription>
                  </div>
                </div>
                {/* <Badge variant={app.status === "enabled" ? "default" : "secondary"}>
                  {app.status}
                </Badge> */}
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="text-sm">
                  <span className="font-medium">App Manager:</span> {app.appManager}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Allowed Tools:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {app.allowedTools.map((cid) => (
                      <a 
                        key={cid} 
                        href={`/ipfs/${cid}`}
                        className="text-sm text-gray-600 hover:text-gray-800 hover:underline flex items-center"
                      >
                        {cid}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  {app.supportEmail && (
                    <Button variant="outline" size="sm">
                      <Mail className="w-4 h-4 mr-2" />
                      Support
                    </Button>
                  )}
                  {app.discordLink && (
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Discord
                    </Button>
                  )}
                  {app.githubLink && (
                    <Button variant="outline" size="sm">
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </Button>
                  )}
                  {app.websiteUrl && (
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Website
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="mt-auto">
              {app.access ? (
                <Button className="w-full" variant="secondary" disabled>
                  In-use
                </Button>
              ) : (
                <Button className="w-full" onClick={() => handleUseApp(app.id)}>
                  Use this App
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
} 