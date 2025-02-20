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
import { VincentApp } from "@/types";
import { ArrowRight, Plus, Settings } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { useAccount } from "wagmi";
import ManageAppScreen from "@/components/developer/ManageAppScreen";
import CreateRoleScreen from "@/components/developer/CreateRoleScreen";
import DelegateeManagerScreen from "@/components/developer/DelegateeManagerScreen";
import ManageRoleScreen from "@/components/developer/ManageRoleScreen";
import { getAppMetadata } from "@/services/api";
import CreateAppScreen from "./create/page";
import { useRouter } from "next/navigation";

export default function Developer() {
    const [app, setApp] = useState<any>(null);
    const [dashboard, setDashboard] = useState<VincentApp>();
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [showManageApp, setShowManageApp] = useState(false);
    const [showDelegateeManager, setShowDelegateeManager] = useState(false);
    const [showCreateRole, setShowCreateRole] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { address, isConnected } = useAccount();

    const router = useRouter();

    useEffect(() => {
        // Mock data following VincentApp interface
        setDashboard({
            appCreator: "0xabcd...efgh",
            appMetadata: {
                appId: "24",
                appName: "Swapping Watcher",
                description: "This is a sample application with full integration capabilities",
                email: "developer@example.com",  // Added required email field
                domain: "swapping-watcher.example.com" // Optional domain
            },
            roles: [
                {
                    roleId: "1",
                    roleName: "Uniswap Watcher",
                    roleDescription: "This is a sample application with full integration capabilities",
                    roleVersion: "1.0.0",
                    enabled: true,
                    toolPolicy: [
                        {
                            toolCId: "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
                            policyCId: "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv"
                        }
                    ]
                },
                {
                    roleId: "2",
                    roleName: "Uniswap Trader",
                    roleDescription: "This is a sample application with full integration capabilities",
                    roleVersion: "3.0.0",
                    enabled: false,
                    toolPolicy: [
                        {
                            toolCId: "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv",
                            policyCId: "QmZbVUwomfUfCa38ia69LrSfH1k8JNK3BHeSUKm5tGMWgv"
                        }
                    ]
                }
            ],
            delegatees: ["0xabcd...efgh"],
            enabled: true
        });
    }, []);

    useEffect(() => {
        async function fetchApp() {
            if (!address) return;
            try {
                const response = await getAppMetadata(address);
                setApp(response.data);
            } catch (error) {
                setApp(null);
                console.error("Error fetching app:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchApp();
    }, [address]);

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <h1 className="text-3xl font-bold">Connect Wallet</h1>
                <p className="text-muted-foreground mb-4">
                    Please connect your wallet to manage your app
                </p>
                <ConnectButton />
                <p className="text-sm text-muted-foreground mt-4">
                    Note: One wallet address can only manage one app. To create another app, please use a different wallet.
                </p>
            </div>
        );
    }

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!app) {
        router.push("/developer/create");
        router.refresh();
    }

    if (showManageApp) {
        return <ManageAppScreen 
            onBack={() => setShowManageApp(false)} 
            dashboard={dashboard}
        />;
    }

    if (showDelegateeManager) {
        return (
            <DelegateeManagerScreen
                onBack={() => setShowDelegateeManager(false)}
                dashboard={dashboard}
            />
        );
    }

    if (showCreateRole) {
        return <CreateRoleScreen 
            onBack={() => setShowCreateRole(false)} 
            dashboard={dashboard}
        />;
    }

    if (selectedRoleId) {
        return <ManageRoleScreen 
            onBack={() => setSelectedRoleId(null)} 
            dashboard={dashboard}
            roleId={parseInt(selectedRoleId)}
        />;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Swapping App</h1>
                <div className="flex gap-2 items-center">
                    <Button
                        variant="default"
                        onClick={() => setShowManageApp(true)}
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
                </div>
            </div>

            {dashboard?.roles.length === 0 ? (
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
                    {dashboard?.roles.map((role) => (
                        <Card key={role.roleId}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle>{role.roleName}</CardTitle>
                                        <CardDescription className="mt-2">
                                            {role.roleDescription}
                                        </CardDescription>
                                    </div>
                                    <Badge
                                        variant={
                                            role.enabled
                                                ? "default"
                                                : "secondary"
                                        }
                                    >
                                        {role.enabled ? "Enabled" : "Disabled"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="text-sm">
                                        <span className="font-medium">
                                            Role ID:
                                        </span>{" "}
                                        {role.roleId}
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-medium">
                                            Role Version:
                                        </span>{" "}
                                        {role.roleVersion}
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={() => setSelectedRoleId(role.roleId)}
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
