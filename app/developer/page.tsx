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
import { ArrowRight, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { useAccount } from "wagmi";
import CreateAppScreen from "@/components/developer/CreateAppScreen";
import ManageAppScreen from "@/components/developer/ManageAppScreen";
import CreateRoleScreen from "@/components/developer/CreateRoleScreen";
import DelegateeManagerScreen from "@/components/developer/DelegateeManagerScreen";
import ManageRoleScreen from "@/components/developer/ManageRoleScreen";

export default function Developer() {
    const [apps, setApps] = useState<VincentApp[]>([]);
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [showManageApp, setShowManageApp] = useState(false);
    const [showDelegateeManager, setShowDelegateeManager] = useState(false);
    const [showCreateRole, setShowCreateRole] = useState(false);
    const { isConnected } = useAccount();

    useEffect(() => {
        // Mock data - replace with actual API call
        setApps([
            {
                appId: "1",
                appName: "Uniswap Watcher",
                description:
                    "This is a sample application with full integration capabilities",
                enabled: true,
                roleVersion: "1",
                appCreator: "0xabcd...efgh",
                roleIds: [1],
                managerDelegatees: ["0xabcd...efgh"],
                toolPolicy: [
                    {
                        toolCId: "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
                        policyCId: "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
                    },
                ],
                email: "support@sample1.com",
                domain: "https://sample1.com",
            },
            {
                appId: "2",
                appName: "Uniswap Trader",
                description: "Another sample application with basic features",
                enabled: false,
                roleVersion: "3",
                appCreator: "0xabcd...efgh",
                roleIds: [2],
                managerDelegatees: [],
                toolPolicy: [
                    {
                        toolCId: "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
                        policyCId: "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
                    },
                ],
                email: "support@sample2.com",
                domain: "https://sample2.com",
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
                <p className="text-muted-foreground">
                    Get some funds through the faucet
                </p>
                <Link
                    href="https://chronicle-yellowstone-faucet.getlit.dev"
                    target="_blank"
                >
                    Faucet
                </Link>
            </div>
        );
    };

    if (!isConnected) {
        return <ConnectWalletScreen />;
    }

    if (showManageApp) {
        return <ManageAppScreen onBack={() => setShowManageApp(false)} />;
    }

    if (showDelegateeManager) {
        return (
            <DelegateeManagerScreen
                onBack={() => setShowDelegateeManager(false)}
            />
        );
    }

    if (showCreateRole) {
        return <CreateRoleScreen onBack={() => setShowCreateRole(false)} />;
    }

    if (selectedAppId) {
        return <ManageRoleScreen 
            onBack={() => setSelectedAppId(null)} 
            appId={parseInt(selectedAppId)}
            roleId={apps.find(app => app.appId === selectedAppId)?.roleIds[0] || 0}
        />;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Swapping App</h1>
                <div className="flex gap-2 items-center">
                    <Button
                        variant="default"
                        onClick={() => setShowCreateRole(true)}
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage App
                    </Button>
                    <Button
                        variant="default"
                        onClick={() => setShowCreateRole(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Role
                    </Button>
                    <Button
                        variant="default"
                        onClick={() => setShowDelegateeManager(true)}
                    >
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
                        <Card key={app.appId}>
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
                                            app.enabled
                                                ? "default"
                                                : "secondary"
                                        }
                                    >
                                        {app.enabled ? "Enabled" : "Disabled"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="text-sm">
                                        <span className="font-medium">
                                            Role ID:
                                        </span>{" "}
                                        {app.appId}
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-medium">
                                            Role Version:
                                        </span>{" "}
                                        {app.roleVersion}
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={() => setSelectedAppId(app.appId)}
                                    >
                                        Manage Role{" "}
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
