"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import { WagmiProvider } from "wagmi";
import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { StytchProvider } from "@stytch/nextjs";
// import { createStytchUIClient } from "@stytch/nextjs/ui";
// import { StytchUIClient } from "@stytch/vanilla-js";
// import { useState } from "react";
// import { useEffect } from "react";
import { defineChain } from "viem";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

const inter = Inter({ subsets: ["latin"] });

export const yellowstone = defineChain({
    id: 175188,
    name: "Yellowstone",
    nativeCurrency: { name: "Yellowstone", symbol: "YSL", decimals: 18 },
    rpcUrls: {
        default: { http: ["https://yellowstone-rpc.litprotocol.com"] },
    },
    blockExplorers: {
        default: {
            name: "Yellowstone Explorer",
            url: "https://yellowstone-explorer.litprotocol.com/",
        },
    },
});

const wagmiConfig = createConfig({
    chains: [yellowstone],
    connectors: [injected()],
    transports: {
        [yellowstone.id]: http(),
    },
});

const queryClient = new QueryClient();

const demoAppInfo = {
    appName: "Vincent",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // const [stytchClient, setStytchClient] = useState<StytchUIClient | null>(
    //     null
    // );

    // useEffect(() => {
    //     const client = createStytchUIClient(
    //         process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN || ""
    //     );
    //     setStytchClient(client);
    // }, []);

    // if (!stytchClient) {
    //     return null; // or a loading state
    // }
    return (
        // <StytchProvider stytch={stytchClient}>
        <html>
            <body>
                <WagmiProvider config={wagmiConfig}>
                    <QueryClientProvider client={queryClient}>
                        <RainbowKitProvider
                            theme={darkTheme()}
                            initialChain={yellowstone}
                            appInfo={demoAppInfo}
                        >
                            <Header />
                            <main className="max-w-screen-xl mx-auto p-6">
                                {children}
                            </main>
                        </RainbowKitProvider>
                    </QueryClientProvider>
                </WagmiProvider>
            </body>
        </html>
        // </StytchProvider>
    );
}
