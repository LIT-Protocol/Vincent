"use client";

import { useEffect, useState } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { useAccount } from "wagmi";
import DashboardScreen from "@/components/developer/Dashboard";
import { formCompleteVincentApp } from "@/services/get-app";
import { useIsMounted } from "@/components/login/hooks/useIsMounted";
import { VincentApp } from "@/types";
import CreateAppScreen from "@/components/developer/CreateApp";
import ConnectWalletScreen from "@/components/developer/ConnectWallet";
export default function Developer() {
    const [app, setApp] = useState<VincentApp | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { address, isConnected } = useAccount();
    const isMounted = useIsMounted();

    useEffect(() => {
        async function fetchVincentApp() {
            if (!address) {
                setIsLoading(false);
                return;
            }
            try {
                // const response = await formCompleteVincentApp(address);
                // setApp(response);
                setApp(null);
            } catch (error) {
                console.error("Error fetching app:", error);
                setApp(null);
            } finally {
                setIsLoading(false);
            }
        }

        if (isMounted) {
            fetchVincentApp();
        }
    }, [address, isMounted]);

    if (!isMounted) return null;

    return (
        <div className="min-h-screen">
            {!isConnected ? (
                <ConnectWalletScreen />
            ) : isLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    Loading...
                </div>
            ) : !app ? (
                <CreateAppScreen />
            ) : (
                <DashboardScreen vincentApp={app} />
            )}
        </div>
    );
}