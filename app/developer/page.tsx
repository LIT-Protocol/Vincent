"use client";

import { useEffect, useState } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { useAccount } from "wagmi";
import DashboardScreen from "@/components/developer/Dashboard";
import { checkIfAppExists, formCompleteVincentAppForDev } from "@/services/get-app";
import { useIsMounted } from "@/components/login/hooks/useIsMounted";
import { VincentApp } from "@/types";
import CreateAppScreen from "@/components/developer/CreateApp";
import ConnectWalletScreen from "@/components/developer/ConnectWallet";

export default function Developer() {
    const [hasApp, setHasApp] = useState<Boolean>(false);
    const [app, setApp] = useState<VincentApp | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isMounted = useIsMounted();

    const { address, isConnected } = useAccount();

    useEffect(() => {
        async function checkAndFetchApp() {
            if (!address) return;

            try {
                const exists = await checkIfAppExists(address);
                console.log("exists", exists);
                // const exists = true;
                setHasApp(exists);

                if (exists) {
                    const appData = await formCompleteVincentAppForDev(address);
                    console.log("dashboard appData", appData);
                    setApp(appData);
                }
            } catch (error) {
                console.error("Error fetching app:", error);
                setHasApp(false);
            } finally {
                setIsLoading(false);
            }
        }

        if (isMounted && isConnected) {
            checkAndFetchApp();
        }
    }, [address, isMounted, isConnected]);

    if (!isMounted) return null;

    if (!isConnected) {
        return (
            <div className="min-h-screen">
                <ConnectWalletScreen />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen">
                <div className="flex items-center justify-center min-h-[60vh]">
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {hasApp ? (
                <DashboardScreen vincentApp={app!} />
            ) : (
                <CreateAppScreen />
            )}
        </div>
    );
}
