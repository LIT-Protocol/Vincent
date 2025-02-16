"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react"

interface AppPermission {
  id: string
  appName: string
  permissions: {
    policies: boolean
    apps: boolean
    tools: boolean
  }
}

export default function Management() {
  const [permissions, setPermissions] = useState<AppPermission[]>([])

  useEffect(() => {
    // Mock data - replace with actual API call
    setPermissions([
      {
        id: "1",
        appName: "Sample App 1",
        permissions: {
          policies: true,
          apps: false,
          tools: true,
        },
      },
      {
        id: "2",
        appName: "Sample App 2",
        permissions: {
          policies: false,
          apps: true,
          tools: false,
        },
      },
    ])
  }, [])

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>AW Management Dashboard</CardTitle>
          <CardDescription>Manage your application permissions and settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application</TableHead>
                <TableHead>Policies</TableHead>
                <TableHead>Apps</TableHead>
                <TableHead>Tools</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>{app.appName}</TableCell>
                  <TableCell>
                    <Switch checked={app.permissions.policies} />
                  </TableCell>
                  <TableCell>
                    <Switch checked={app.permissions.apps} />
                  </TableCell>
                  <TableCell>
                    <Switch checked={app.permissions.tools} />
                  </TableCell>
                  <TableCell>
                    <Button variant="destructive" size="sm">Revoke</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 