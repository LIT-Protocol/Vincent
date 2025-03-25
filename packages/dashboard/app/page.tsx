"use client";

import { useEffect, useState } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { useAccount } from "wagmi";
import DashboardScreen from "@/components/developer/Dashboard";
import { formCompleteVincentAppForDev } from "@/services";
import { useIsMounted } from "@/hooks/useIsMounted";
import { AppView } from "@/services/types";
import CreateAppScreen from "@/components/developer/CreateApp";
import ConnectWalletScreen from "@/components/developer/ConnectWallet";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Developer() {
    const [hasApp, setHasApp] = useState<Boolean>(false);
    const [app, setApp] = useState<AppView[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isMounted = useIsMounted();
    const [refetchApp, setRefetchApp] = useState(0);

    const { address, isConnected } = useAccount();

    useEffect(() => {
        async function checkAndFetchApp() {
            if (!address) return;

            try {
                const appData = await formCompleteVincentAppForDev(address);
                const exists = appData && appData.length > 0;
                setHasApp(exists);
                if (exists) {
                    setApp(appData);
                }
            } catch (error) {
                // Check if this is the NoAppsFoundForManager error
                if (error instanceof Error && 
                    (error.message.includes("NoAppsFoundForManager") || 
                     error.message.includes("call revert exception"))) {
                    // This is expected when the user hasn't created any apps yet
                    console.log("No apps found for this address");
                    setHasApp(false);
                } else {
                    // Log other unexpected errors
                    console.error("Error fetching app:", error);
                    setHasApp(false);
                }
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