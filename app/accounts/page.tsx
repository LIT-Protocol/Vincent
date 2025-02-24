"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { Plus, Wallet } from "lucide-react"
import Link from "next/link"

interface AgentWallet {
  address: string;
  isActive: boolean;
  name: string;
  balance: number;
}

export default function Accounts() {
  const [wallets, setWallets] = useState<AgentWallet[]>([])
  const [activeWallet, setActiveWallet] = useState<AgentWallet | null>(null)

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockWallets: AgentWallet[] = [
      {
        address: "0xC7CdAb64849B303846406F4231Dbe6ea8270fD86",
        isActive: true,
        name: "Wallet",
        balance: 0.1 
      },
      {
        address: "0xD98eE99d46d7A0e33ac4dA720035c5729F36d3d3",
        isActive: false,
        name: "Wallet",
        balance: 0.2
      },
      {
        address: "0xFAE415b6660730f7d3c9c96391aC6b54ddcf1e39",
        isActive: false,
        name: "Wallet",
        balance: 0.3
      },
      {
        address: "0x212d49debE509F8cB0c306EE4F7F72C27D203b77",
        isActive: false,
        name: "Wallet",
        balance: 0.4
      }
    ]
    setWallets(mockWallets)
    setActiveWallet(mockWallets.find(w => w.isActive) || null)
  }, [])

  const handleSetActiveWallet = (wallet: AgentWallet) => {
    // Update active wallet logic here
    setWallets(prev => prev.map(w => ({
      ...w,
      isActive: w.address === wallet.address
    })))
    setActiveWallet(wallet)
  }

  const handleCreateWallet = () => {
    // Implement wallet creation logic
    console.log("Creating new wallet...")
  }

  return (
    <div className="space-y-8">
        <div>
          {activeWallet ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-large">Active Agent Wallet</p>
                  <p className="text-sm text-muted-foreground break-all">
                    {activeWallet.address}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
              
              {/* Transaction Input Section */}
              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="txInput" className="block text-sm font-medium mb-2">
                    Transaction Object
                  </label>
                  <textarea
                    id="txInput"
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    placeholder="Paste your transaction object here (JSON format)"
                    onChange={(e) => {
                      // You'll need to add state management here
                      // setTxInput(e.target.value);
                    }}
                  />
                </div>
                <button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
                  onClick={async () => {
                    // Add your transaction signing and broadcasting logic here
                    // Example:
                    // try {
                    //   const txObj = JSON.parse(txInput);
                    //   const signedTx = await activeWallet.signTransaction(txObj);
                    //   const result = await broadcastTransaction(signedTx);
                    // } catch (error) {
                    //   console.error('Transaction failed:', error);
                    // }
                  }}
                >
                  Send from Agent
                </button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No active wallet selected</p>
          )}
        </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Agent Wallets</h2>
          <Button onClick={handleCreateWallet}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Wallet
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wallets.map((wallet) => (
            <Card key={wallet.address} className={wallet.isActive ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      {wallet.name}
                    </CardTitle>
                  </div>
                  {!wallet.isActive && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSetActiveWallet(wallet)}
                    >
                      Set Active
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground break-all">
                  {wallet.address}
                </p>
                <p className="text-sm text-muted-foreground break-all">
                  Balance: {wallet.balance} TSTLPX
                </p>
                <div className="mt-4">
                  <Link href={`/accounts/${wallet.address}/settings`}>
                    <Button variant="secondary" size="sm" className="w-full">
                      Manage Wallet
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
