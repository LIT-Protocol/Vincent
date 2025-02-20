"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { useAccount } from "wagmi";
import DashboardScreen from "@/components/developer/Dashboard";
import { formCompleteVincentApp } from "@/services/api";
import { useIsMounted } from "@/components/login/hooks/useIsMounted";
import { VincentApp } from "@/types";
import CreateAppScreen from "@/components/developer/CreateApp";

export default function Developer() {
    const [app, setApp] = useState<VincentApp | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { address, isConnected } = useAccount();
    const isMounted = useIsMounted();
    const router = useRouter();

    useEffect(() => {
        async function fetchVincentApp() {
            if (!address) return;
            try {
                const response = await formCompleteVincentApp(address);
                setApp(response);
            } catch (error) {
                setApp(null);
                console.error("Error fetching app:", error);
            } finally {
                setIsLoading(false);
            }
        }

        if (isMounted) {
            fetchVincentApp();
        }
    }, [address, isMounted]);

    if (!isMounted) return null;

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <h1 className="text-3xl font-bold">Connect Wallet</h1>
                <p className="text-muted-foreground mb-4">
                    Please connect your wallet to manage your app
                </p>
                <ConnectButton />
                <p className="text-sm text-muted-foreground mt-4">
                    Note: One wallet address can only manage one app. To create
                    another app, please use a different wallet.
                </p>
            </div>
        );
    }

    if (isLoading) {
        return <div>Loading...</div>;
    }

    // if (app && isLoading == false) {
    //     return <CreateAppScreen />;
    // }

    if (app == null && isLoading == false) {
        return <CreateAppScreen />;
    }

    return <DashboardScreen vincentApp={app!} />;
}
