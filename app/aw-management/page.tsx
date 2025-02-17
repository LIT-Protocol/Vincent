"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ExternalLink, Plus } from "lucide-react"

interface Policy {
  cid: string;
  enabled: boolean;
}

interface Tool {
  cid: string;
  enabled: boolean;
  policies: Policy[];
}

interface AppPermission {
  id: string;
  appName: string;
  tools: Tool[];
}

const mockPermissions: AppPermission[] = [
  {
    id: "1",
    appName: "Sample App 1",
    tools: [
      {
        cid: "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
        enabled: true,
        policies: [
          {
            cid: "QmaLAZCJEk5B4BW962pjENxCDHvwGtPptCamhckk9GJxJe",
            enabled: true
          }
        ]
      },
      {
        cid: "QmaLAZCJEk5B4BW962pjENxCDHvwGtPptCamhckk9GJxJe",
        enabled: false,
        policies: []
      }
    ]
  },
  {
    id: "2",
    appName: "Sample App 2",
    tools: [
      {
        cid: "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
        enabled: true,
        policies: []
      }
    ]
  }
];

export default function Management() {
  const [permissions, setPermissions] = useState<AppPermission[]>([])
  const [availablePolicies] = useState([
    "QmaLAZCJEk5B4BW962pjENxCDHvwGtPptCamhckk9GJxJe",
    "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv"
  ])

  useEffect(() => {
    // Mock data - replace with actual API call
    setPermissions(mockPermissions)
  }, [])

  const toggleTool = (appId: string, toolCid: string) => {
    setPermissions(prev => prev.map(app => {
      if (app.id === appId) {
        return {
          ...app,
          tools: app.tools.map(tool => {
            if (tool.cid === toolCid) {
              return { ...tool, enabled: !tool.enabled }
            }
            return tool
          })
        }
      }
      return app
    }))
  }

  const togglePolicy = (appId: string, toolCid: string, policyCid: string) => {
    setPermissions(prev => prev.map(app => {
      if (app.id === appId) {
        return {
          ...app,
          tools: app.tools.map(tool => {
            if (tool.cid === toolCid) {
              return {
                ...tool,
                policies: tool.policies.map(policy => {
                  if (policy.cid === policyCid) {
                    return { ...policy, enabled: !policy.enabled }
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

  const addPolicy = (appId: string, toolCid: string, policyCid: string) => {
    setPermissions(prev => prev.map(app => {
      if (app.id === appId) {
        return {
          ...app,
          tools: app.tools.map(tool => {
            if (tool.cid === toolCid) {
              return {
                ...tool,
                policies: [...tool.policies, { cid: policyCid, enabled: true }]
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
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>AW Management Dashboard</CardTitle>
          <CardDescription>Manage your application permissions and settings</CardDescription>
        </CardHeader>
        <CardContent>
          {permissions.map((app) => (
            <div key={app.id} className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{app.appName}</h3>
                <Button variant="destructive" size="sm">Revoke App</Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Policies</TableHead>
                    <TableHead>Add Policy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {app.tools.map((tool) => (
                    <TableRow key={tool.cid}>
                      <TableCell>
                        <Link 
                          href={`/ipfs/${tool.cid}`}
                          className="flex items-center hover:underline"
                        >
                          {tool.cid.substring(0, 20)}...
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={tool.enabled}
                          onCheckedChange={() => toggleTool(app.id, tool.cid)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {tool.policies.map((policy) => (
                            <div key={policy.cid} className="flex items-center gap-2">
                              <Switch 
                                checked={policy.enabled}
                                onCheckedChange={() => togglePolicy(app.id, tool.cid, policy.cid)}
                              />
                              <Link 
                                href={`/ipfs/${policy.cid}`}
                                className="flex items-center hover:underline text-sm"
                              >
                                {policy.cid.substring(0, 20)}...
                                <ExternalLink className="ml-2 h-3 w-3" />
                              </Link>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select onValueChange={(value) => addPolicy(app.id, tool.cid, value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Add policy" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePolicies.map((policy) => (
                              <SelectItem key={policy} value={policy}>
                                {policy.substring(0, 20)}...
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
} 