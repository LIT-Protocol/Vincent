"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { VincentApp } from "@/types"
import { ExternalLink, Mail, Settings } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getVincentAppForUser } from "@/services/get-app"
import { usePKPAccount } from "@/hooks/usePKPAccount"

export default function Library() {
  const [apps, setApps] = useState<any[]>([])
  const { currentAccount } = usePKPAccount()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchApps() {
      if (!currentAccount) {
        setIsLoading(false)
        return
      }
      try {
        const app = await getVincentAppForUser(currentAccount.ethAddress)
        setApps(app)
      } catch (error) {
        console.error("Error fetching apps:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchApps()
  }, [currentAccount])

  const toggleRoleStatus = async (appName: string, roleId: string) => {
    // Implement role toggle functionality using contract calls
    setApps(apps.map(app => {
      if (app.appMetadata.appName === appName) {
        return {
          ...app,
          roles: app.roles.map((role: any) => {
            if (role.roleId === roleId) {
              return {
                ...role,
                enabled: !role.enabled
              }
            }
            return role
          })
        }
      }
      return app
    }))
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Apps Library</h1>
        {/* {address && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/accounts/${address}/settings`}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        )} */}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Apps</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="disabled">Disabled</TabsTrigger>
        </TabsList>
        <ScrollArea className="h-[calc(100vh-20rem)]">
          <TabsContent value="all" className="space-y-4 mt-6">
            {apps.map((app, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{app.appName}</CardTitle>
                      <CardDescription className="mt-1">
                        {app.description}
                      </CardDescription>
                    </div>
                    {/* <Badge variant={app.enabled ? "default" : "secondary"}>
                      {app.enabled ? "Enabled" : "Disabled"}
                    </Badge> */}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">App Creator</h4>
                      <p className="text-sm text-muted-foreground">{app.appCreator}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-3">Roles</h4>
                      <div className="space-y-3">
                        {app.roles?.map((role: any) => (
                          <div key={role.roleId} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h5 className="font-medium">{role.roleName}</h5>
                                <p className="text-sm text-gray-600">{role.roleDescription}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* <span className="text-sm text-gray-600">
                                  {role.enabled ? "Enabled" : "Disabled"}
                                </span> */}
                                {/* <Switch
                                  checked={role.enabled}
                                  onCheckedChange={() => toggleRoleStatus(app.appMetadata.appId, role.roleId)}
                                /> */}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2 border-t pt-4">
                  {app.contactEmail && (
                    <Button variant="outline" size="sm">
                      <Mail className="w-4 h-4 mr-2" />
                      Support
                    </Button>
                  )}
                  {/* {app.appMetadata.domain && (
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Website
                    </Button>
                  )} */}
                </CardFooter>
              </Card>
            ))}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
} 