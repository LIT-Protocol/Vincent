"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/layout/Header";
import { WagmiProvider } from "wagmi";
import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StytchProvider } from "@stytch/nextjs";
import { createStytchUIClient } from "@stytch/nextjs/ui";

const inter = Inter({ subsets: ["latin"] });

export const config = createConfig({
    chains: [mainnet, sepolia],
    connectors: [injected()],
    transports: {
        [mainnet.id]: http(),
        [sepolia.id]: http(),
    },
});

const queryClient = new QueryClient();

const stytch = createStytchUIClient(
    process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN || ""
);

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <StytchProvider stytch={stytch}>
            <WagmiProvider config={config}>
                <QueryClientProvider client={queryClient}>
                    <html lang="en">
                        <body
                            className={cn(
                                inter.className,
                                "min-h-screen bg-background"
                            )}
                        >
                            <Header />
                            <main className="max-w-screen-xl mx-auto p-6">
                                {children}
                            </main>
                        </body>
                    </html>
                </QueryClientProvider>
            </WagmiProvider>
        </StytchProvider>
    );
}
