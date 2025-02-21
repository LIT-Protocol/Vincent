import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export default function ConnectWalletScreen() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-md mx-auto px-4">
            <div className="bg-card p-8 rounded-xl shadow-lg w-full space-y-6 border border-border">
                <div className="text-center space-y-3">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Connect Wallet
                    </h1>
                    <p className="text-muted-foreground">
                        Please connect your wallet to manage your app
                    </p>
                </div>
                
                <div className="flex flex-col items-center space-y-4">
                    <ConnectButton />
                    
                    <Link 
                        href="https://chronicle-yellowstone-faucet.getlit.dev" 
                        target="_blank"
                        className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
                    >
                        <span>Get testnet tokens</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </Link>
                </div>

                <div className="border-t border-border pt-6 mt-6">
                    <p className="text-sm text-muted-foreground text-center">
                        Note: One wallet address can only manage one app. To create
                        another app, please use a different wallet.
                    </p>
                </div>
            </div>
        </div>
    )
}