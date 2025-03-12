"use client";

import { useEffect, useState } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { useAccount } from "wagmi";
import DashboardScreen from "@/components/developer/Dashboard";
import { checkIfAppExists, formCompleteVincentAppForDev } from "@/services/get-app";
import { useIsMounted } from "@/hooks/useIsMounted";
import { VincentApp } from "@/types";
import CreateAppScreen from "@/components/developer/CreateApp";
import ConnectWalletScreen from "@/components/developer/ConnectWallet";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Developer() {
    const [hasApp, setHasApp] = useState<Boolean>(false);
    const [app, setApp] = useState<VincentApp | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isMounted = useIsMounted();
    const [refetchApp, setRefetchApp] = useState(0);

    const { address, isConnected } = useAccount();

    useEffect(() => {
        async function checkAndFetchApp() {
            if (!address) return;

            try {
                const exists = await checkIfAppExists(address);
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
    }, [address, isMounted, isConnected, refetchApp]);

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
             <ScrollArea className="h-[calc(123vh-20rem)]">

            {hasApp ? (
                <DashboardScreen onRefetch={() => setRefetchApp(refetchApp + 1)} vincentApp={app!} />
            ) : (
                <CreateAppScreen />
            )}
            </ScrollArea>
        </div>
    );
}