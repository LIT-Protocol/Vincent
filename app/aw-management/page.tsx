"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ExternalLink, Plus } from "lucide-react"
import React from "react"

interface Policy {
  cid: string;
  enabled: boolean;
}

interface Tool {
  cid: string;
  enabled: boolean;
  policies: Policy[];
  showAddPolicy?: boolean;
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

  const toggleAddPolicy = (appId: string, toolCid: string) => {
    setPermissions(prev => prev.map(app => {
      if (app.id === appId) {
        return {
          ...app,
          tools: app.tools.map(tool => {
            if (tool.cid === toolCid) {
              return {
                ...tool,
                showAddPolicy: !tool.showAddPolicy
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
    if (!policyCid.trim()) return;
    
    setPermissions(prev => prev.map(app => {
      if (app.id === appId) {
        return {
          ...app,
          tools: app.tools.map(tool => {
            if (tool.cid === toolCid) {
              return {
                ...tool,
                showAddPolicy: false,
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
          <CardTitle>Agent Wallet Management Dashboard</CardTitle>
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
                    <TableHead className="w-[300px]">Tool</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[420px]">Policies</TableHead>
                    <TableHead className="w-[200px]">Add Policy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {app.tools.map((tool) => (
                    <React.Fragment key={tool.cid}>
                      <TableRow>
                        <TableCell className="w-[300px]">
                          <Link 
                            href={`/ipfs/${tool.cid}`}
                            className="flex items-center hover:underline"
                          >
                            {tool.cid.substring(0, 20)}...
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Link>
                        </TableCell>
                        <TableCell className="w-[100px]">
                          <Switch 
                            checked={tool.enabled}
                            onCheckedChange={() => toggleTool(app.id, tool.cid)}
                          />
                        </TableCell>
                        <TableCell className="w-[300px]">
                          <div className="space-y-2 min-h-[28px]">
                            {tool.policies.length > 0 ? (
                              tool.policies.map((policy) => (
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
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No Policy</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="w-[200px]">
                          <div className="space-y-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleAddPolicy(app.id, tool.cid)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Policy
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {tool.showAddPolicy && (
                        <TableRow>
                          <TableCell className="border-0" />
                          <TableCell className="border-0" />
                          <TableCell colSpan={2} className="py-2">
                            <div className="flex gap-2 max-w-[calc(100%-6rem)]">
                              <input
                                type="text"
                                placeholder="Enter policy CID"
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    addPolicy(app.id, tool.cid, e.currentTarget.value);
                                    e.currentTarget.value = '';
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  const input = e.currentTarget.previousSibling as HTMLInputElement;
                                  addPolicy(app.id, tool.cid, input.value);
                                  input.value = '';
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
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