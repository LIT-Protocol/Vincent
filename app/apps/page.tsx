"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface VincentApp {
  id: string
  name: string
  description: string
  status: "active" | "pending"
}

export default function Apps() {
  const [apps, setApps] = useState<VincentApp[]>([])

  useEffect(() => {
    // Mock data - replace with actual API call
    setApps([
      {
        id: "1",
        name: "Sample App 1",
        description: "This is a sample application",
        status: "active",
      },
      {
        id: "2",
        name: "Sample App 2",
        description: "Another sample application",
        status: "pending",
      },
    ])
  }, [])

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Vincent Applications</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {apps.map((app) => (
          <Card key={app.id}>
            <CardHeader>
              <CardTitle>{app.name}</CardTitle>
              <CardDescription>{app.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span>Status:</span>
                <span className={`px-2 py-1 rounded-full text-sm ${
                  app.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                }`}>
                  {app.status}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Grant Access</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
} 