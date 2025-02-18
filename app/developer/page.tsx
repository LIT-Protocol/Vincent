"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { VincentApp } from "@/types/vincent";
import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { useAccount } from "wagmi";
import AppManagerScreen from "@/components/developer/AppManagerScreen";
import CreateAppScreen from "@/components/developer/CreateAppScreen";
import DelegateeManagerScreen from "@/components/developer/DelegateeManagerScreen";

export default function Developer() {
    const [apps, setApps] = useState<VincentApp[]>([]);
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [showCreateApp, setShowCreateApp] = useState(false);
    const [showDelegateeManager, setShowDelegateeManager] = useState(false);
    const { isConnected } = useAccount();

    useEffect(() => {
        // Mock data - replace with actual API call
        setApps([
            {
                id: "1",
                appName: "Sample Role 1",
                description:
                    "This is a sample application with full integration capabilities",
                status: "enabled",
                appManager: "0x1234...5678",
                managerDelegatees: ["0xabcd...efgh"],
                appId: 1,
                allowedTools: [
                    "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
                ],
                supportEmail: "support@sample1.com",
                discordLink: "https://discord.gg/sample1",
                githubLink: "https://github.com/sample1",
                websiteUrl: "https://sample1.com",
            },
            {
                id: "2",
                appName: "Sample Role 2",
                description: "Another sample application with basic features",
                status: "disabled",
                appManager: "0x8765...4321",
                managerDelegatees: [],
                appId: 2,
                allowedTools: [
                    "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
                ],
                supportEmail: "support@sample2.com",
                githubLink: "https://github.com/sample2",
            },
        ]);
    }, []);

    const ConnectWalletScreen = () => {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <h1 className="text-3xl font-bold">Connect Wallet</h1>
                <p className="text-muted-foreground">
                    Please connect your wallet to manage your apps
                </p>
                <ConnectButton />
            </div>
        );
    };

    if (!isConnected) {
        return <ConnectWalletScreen />;
    }

    if (showCreateApp) {
        return (
            <CreateAppScreen
                onBack={() => setShowCreateApp(false)}
            />
        );
    }

    if (showDelegateeManager) {
        return (
            <DelegateeManagerScreen
                onBack={() => setShowDelegateeManager(false)}
            />
        );
    }

    if (selectedAppId) {
        return (
            <AppManagerScreen
                appId={selectedAppId}
                onBack={() => setSelectedAppId(null)}
            />
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">My Apps</h1>
                <div className="flex gap-2 items-center">
                    <Button variant="default" onClick={() => setShowCreateApp(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New App
                    </Button>
                    <Button variant="default" onClick={() => setShowDelegateeManager(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Delegatee
                    </Button>
                    <ConnectButton.Custom>
                        {({
                            account,
                            chain,
                            openConnectModal,
                            openChainModal,
                            openAccountModal,
                            mounted,
                        }) => {
                            const ready = mounted;
                            if (!ready) return null;

                            return (
                                <div>
                                    {!account && (
                                        <Button
                                            variant="outline"
                                            onClick={openConnectModal}
                                        >
                                            Connect Wallet
                                        </Button>
                                    )}
                                    {account && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={openChainModal}
                                                className="flex gap-2 items-center"
                                            >
                                                {chain && (
                                                    <div className="h-4 w-4">
                                                        {chain.hasIcon &&
                                                            chain.iconUrl && (
                                                                <img
                                                                    alt={
                                                                        chain.name
                                                                    }
                                                                    src={
                                                                        chain.iconUrl
                                                                    }
                                                                    className="h-full w-full"
                                                                />
                                                            )}
                                                    </div>
                                                )}
                                                {chain?.name || "Unknown Chain"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={openAccountModal}
                                                className="flex gap-2 items-center"
                                            >
                                                {account.displayName}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        }}
                    </ConnectButton.Custom>
                </div>
            </div>

            {apps.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No Apps Found</CardTitle>
                        <CardDescription>
                            You haven&apos;t created any Vincent applications
                            yet.
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
                                        <CardDescription className="mt-2">
                                            {app.description}
                                        </CardDescription>
                                    </div>
                                    <Badge
                                        variant={
                                            app.status === "enabled"
                                                ? "default"
                                                : "secondary"
                                        }
                                    >
                                        {app.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="text-sm">
                                        <span className="font-medium">
                                            Role:
                                        </span>{" "}
                                        {app.appId}
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-medium">
                                            Manager:
                                        </span>{" "}
                                        {app.appManager}
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={() => setSelectedAppId(app.id)}
                                    >
                                        Manage App{" "}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
