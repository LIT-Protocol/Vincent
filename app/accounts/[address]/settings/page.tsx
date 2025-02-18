"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Plus, ArrowLeft } from "lucide-react";
import React from "react";

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

export default function WalletSettings() {
  const params = useParams();
  const router = useRouter();
  const [permissions, setPermissions] = useState<AppPermission[]>([]);
  const walletAddress = params.address as string;

  useEffect(() => {
    // Mock data - replace with actual API call for specific wallet
    setPermissions([
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
          }
        ]
      },
      {
        id: "1",
        appName: "Sample App 2",
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
          }
        ]
      }
    ]);
  }, [walletAddress]);

  // Reuse the same toggle functions from aw-management
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
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Wallet Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wallet Permissions</CardTitle>
          <CardDescription>
            Manage permissions for wallet: {walletAddress}
          </CardDescription>
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
                    <TableHead>Policies</TableHead>
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
                              <Switch checked={policy.enabled} />
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
