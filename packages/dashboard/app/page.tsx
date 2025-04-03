"use client";

import { useEffect, useState } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { useAccount } from "wagmi";
import DashboardScreen from "@/components/developer/Dashboard";
import { formCompleteVincentAppForDev } from "@/services";
import { useIsMounted } from "@/hooks/useIsMounted";
import { AppView } from "@/services/types";
import dynamic from 'next/dynamic';
import ConnectWalletScreen from "@/components/developer/ConnectWallet";

// Use dynamic import for CreateAppScreen to prevent SSR hydration issues
const CreateAppScreen = dynamic(
  () => import("@/components/developer/CreateApp"),
  { ssr: false }
);

export default function Developer() {
    const [hasApp, setHasApp] = useState<Boolean>(false);
    const [app, setApp] = useState<AppView[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isMounted = useIsMounted();

    const { address, isConnected } = useAccount();

    useEffect(() => {
        async function checkAndFetchApp() {
            if (!address) return;
            setIsLoading(true);
            try {
                const appData = await formCompleteVincentAppForDev(address);
                const exists = appData && appData.length > 0;
              
                if (exists) {
                    setApp(appData);
                    setHasApp(true);
                } else {
                    setHasApp(false);
                    setApp(null);
                }
            } catch (error) {
                // Check if this is the NoAppsFoundForManager error
                if (error instanceof Error && 
                    (error.message.includes("NoAppsFoundForManager") || 
                     error.message.includes("call revert exception"))) {
                    // This is expected when the user hasn't created any apps yet
                    console.log("No apps found for this address");
                    setHasApp(false);
                    setApp(null);
                } else {
                    // Log other unexpected errors
                    console.error("Error fetching app:", error);
                    setHasApp(false);
                    setApp(null);
                }
            } finally {
                setIsLoading(false);
            }
        }

        if (isMounted && isConnected) {
            checkAndFetchApp();
        } else if (isMounted) {
            // If mounted but not connected, stop loading state
            setIsLoading(false);
        }
    }, [address, isMounted, isConnected]);

    // Return null while client-side is initializing to prevent hydration mismatch
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
                // Only render the CreateAppScreen once we're client-side 
                <CreateAppScreen />
            )}
        </div>
    );
}