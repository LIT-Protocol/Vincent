"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { VincentApp } from "@/types/vincent"
import { ExternalLink, Github, Mail, MessageSquare, Settings} from "lucide-react"
import Image from "next/image"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"

export default function Library() {
  const [apps, setApps] = useState<(VincentApp & { tools: { cid: string; status: string; policies: { cid: string; status: string }[] }[] })[]>([])
  const [mockAddress] = useState("0x1234567890123456789012345678901234567890")

  useEffect(() => {
    // Mock data - replace with actual API call
    setApps([
      {
        id: "1",
        appName: "Sample App 1",
        description: "This is a sample application with full integration capabilities",
        appManager: "0x1234...5678",
        managerDelegatees: ["0xabcd...efgh"],
        appId: 1,
        status: "enabled",
        allowedTools: ["QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv"],
        tools: [
          {
            cid: "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
            status: "enabled",
            policies: [
              { cid: "QmPolicy1", status: "enabled" },
              { cid: "QmPolicy2", status: "disabled" }
            ]
          },
          {
            cid: "QmaLAZCJEk5B4BW962pjENxCDHvwGtPptCamhckk9GJxJe",
            status: "disabled",
            policies: [
              { cid: "QmPolicy3", status: "enabled" }
            ]
          }
        ],
        supportEmail: "support@sample1.com",
        githubLink: "https://github.com/sample1",
        websiteUrl: "https://sample1.com"
      },
      {
        id: "2",
        appName: "Sample App 2",
        description: "This is another sample application with full integration capabilities",
        appManager: "0x8765...4321",
        managerDelegatees: ["0xwxyz...abcd"],
        appId: 2,
        status: "disabled",
        allowedTools: ["QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv"],
        tools: [
          // Add tools array for second app
        ],
        supportEmail: "support@sample2.com",
        githubLink: "https://github.com/sample2",
        websiteUrl: "https://sample2.com"
      }
    ])
  }, [])

  const toggleToolStatus = (appId: string, toolCid: string) => {
    setApps(apps.map(app => {
      if (app.id === appId) {
        return {
          ...app,
          tools: app.tools.map(tool => {
            if (tool.cid === toolCid) {
              return {
                ...tool,
                status: tool.status === "enabled" ? "disabled" : "enabled"
              }
            }
            return tool
          })
        }
      }
      return app
    }))
  }

  const togglePolicyStatus = (appId: string, toolCid: string, policyCid: string) => {
    setApps(apps.map(app => {
      if (app.id === appId) {
        return {
          ...app,
          tools: app.tools.map(tool => {
            if (tool.cid === toolCid) {
              return {
                ...tool,
                policies: tool.policies.map(policy => {
                  if (policy.cid === policyCid) {
                    return {
                      ...policy,
                      status: policy.status === "enabled" ? "disabled" : "enabled"
                    }
                  }
                  return policy
                })
              }
            }
            return tool
          })
        }
      }
      return app
    }))
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Apps Library</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/accounts/${mockAddress}/settings`}>
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Apps</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="disabled">Disabled</TabsTrigger>
        </TabsList>
        <ScrollArea className="h-[calc(100vh-20rem)]">
          <TabsContent value="all" className="space-y-4 mt-6">
            {apps.map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {app.logo && (
                        <Image 
                          src={app.logo} 
                          alt={`${app.appName} logo`} 
                          width={48}
                          height={48}
                          className="rounded-lg"
                        />
                      )}
                      <div>
                        <CardTitle>{app.appName}</CardTitle>
                        <CardDescription className="mt-1">{app.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={app.status === "enabled" ? "default" : "secondary"}>
                      {app.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">App Manager</h4>
                      <p className="text-sm text-muted-foreground">{app.appManager}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-3">Tools and Policies</h4>
                      <div className="space-y-3">
                        {app.tools.map((tool) => (
                          <div key={tool.cid} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <a 
                                href={`/ipfs/${tool.cid}`}
                                className="text-sm text-gray-600 hover:text-gray-800 hover:underline flex items-center"
                              >
                                {tool.cid}
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                  {tool.status === "enabled" ? "Enabled" : "Disabled"}
                                </span>
                                <Switch
                                  checked={tool.status === "enabled"}
                                  onCheckedChange={() => toggleToolStatus(app.id, tool.cid)}
                                />
                              </div>
                            </div>
                            <div className="pl-4 border-l-2 border-gray-200">
                              <p className="text-sm text-gray-600 mb-2">Policies:</p>
                              {tool.policies.map((policy) => (
                                <div key={policy.cid} className="flex items-center justify-between mb-2">
                                  <a 
                                    href={`/ipfs/${policy.cid}`}
                                    className="text-sm text-gray-600 hover:text-gray-800 hover:underline flex items-center"
                                  >
                                    {policy.cid}
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                  </a>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">
                                      {policy.status === "enabled" ? "Enabled" : "Disabled"}
                                    </span>
                                    <Switch
                                      checked={policy.status === "enabled"}
                                      onCheckedChange={() => togglePolicyStatus(app.id, tool.cid, policy.cid)}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2 border-t pt-4">
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
                  <Button variant="destructive" size="sm" className="ml-auto">
                    Disable App
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="active" className="space-y-4 mt-6">
            {apps.filter(app => app.status === "enabled").map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {app.logo && (
                        <Image 
                          src={app.logo} 
                          alt={`${app.appName} logo`} 
                          width={48}
                          height={48}
                          className="rounded-lg"
                        />
                      )}
                      <div>
                        <CardTitle>{app.appName}</CardTitle>
                        <CardDescription className="mt-1">{app.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={app.status === "enabled" ? "default" : "secondary"}>
                      {app.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">App Manager</h4>
                      <p className="text-sm text-muted-foreground">{app.appManager}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-3">Tools and Policies</h4>
                      <div className="space-y-3">
                        {app.tools.map((tool) => (
                          <div key={tool.cid} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <a 
                                href={`/ipfs/${tool.cid}`}
                                className="text-sm text-gray-600 hover:text-gray-800 hover:underline flex items-center"
                              >
                                {tool.cid}
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                  {tool.status === "enabled" ? "Enabled" : "Disabled"}
                                </span>
                                <Switch
                                  checked={tool.status === "enabled"}
                                  onCheckedChange={() => toggleToolStatus(app.id, tool.cid)}
                                />
                              </div>
                            </div>
                            <div className="pl-4 border-l-2 border-gray-200">
                              <p className="text-sm text-gray-600 mb-2">Policies:</p>
                              {tool.policies.map((policy) => (
                                <div key={policy.cid} className="flex items-center justify-between mb-2">
                                  <a 
                                    href={`/ipfs/${policy.cid}`}
                                    className="text-sm text-gray-600 hover:text-gray-800 hover:underline flex items-center"
                                  >
                                    {policy.cid}
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                  </a>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">
                                      {policy.status === "enabled" ? "Enabled" : "Disabled"}
                                    </span>
                                    <Switch
                                      checked={policy.status === "enabled"}
                                      onCheckedChange={() => togglePolicyStatus(app.id, tool.cid, policy.cid)}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2 border-t pt-4">
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
                  <Button variant="destructive" size="sm" className="ml-auto">
                    Disable App
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="disabled" className="space-y-4 mt-6">
            {apps.filter(app => app.status === "disabled").map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {app.logo && (
                        <Image 
                          src={app.logo} 
                          alt={`${app.appName} logo`} 
                          width={48}
                          height={48}
                          className="rounded-lg"
                        />
                      )}
                      <div>
                        <CardTitle>{app.appName}</CardTitle>
                        <CardDescription className="mt-1">{app.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={app.status === "enabled" ? "default" : "secondary"}>
                      {app.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">App Manager</h4>
                      <p className="text-sm text-muted-foreground">{app.appManager}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-3">Tools and Policies</h4>
                      <div className="space-y-3">
                        {app.tools.map((tool) => (
                          <div key={tool.cid} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <a 
                                href={`/ipfs/${tool.cid}`}
                                className="text-sm text-gray-600 hover:text-gray-800 hover:underline flex items-center"
                              >
                                {tool.cid}
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                  {tool.status === "enabled" ? "Enabled" : "Disabled"}
                                </span>
                                <Switch
                                  checked={tool.status === "enabled"}
                                  onCheckedChange={() => toggleToolStatus(app.id, tool.cid)}
                                />
                              </div>
                            </div>
                            <div className="pl-4 border-l-2 border-gray-200">
                              <p className="text-sm text-gray-600 mb-2">Policies:</p>
                              {tool.policies.map((policy) => (
                                <div key={policy.cid} className="flex items-center justify-between mb-2">
                                  <a 
                                    href={`/ipfs/${policy.cid}`}
                                    className="text-sm text-gray-600 hover:text-gray-800 hover:underline flex items-center"
                                  >
                                    {policy.cid}
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                  </a>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">
                                      {policy.status === "enabled" ? "Enabled" : "Disabled"}
                                    </span>
                                    <Switch
                                      checked={policy.status === "enabled"}
                                      onCheckedChange={() => togglePolicyStatus(app.id, tool.cid, policy.cid)}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2 border-t pt-4">
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
                  <Button variant="destructive" size="sm" className="ml-auto">
                    Disable App
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
} 