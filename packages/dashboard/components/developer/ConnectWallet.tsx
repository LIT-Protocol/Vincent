import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function ConnectWalletScreen() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-md mx-auto px-4">
            <Card className="w-full">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-black">Connect Wallet</CardTitle>
                    <CardDescription className="text-black">
                        Please connect your wallet to manage your app
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                    <div className="flex justify-center">
                        <ConnectButton.Custom>
                            {({
                                account,
                                chain,
                                openAccountModal,
                                openChainModal,
                                openConnectModal,
                                authenticationStatus,
                                mounted,
                            }) => {
                                const ready = mounted && authenticationStatus !== 'loading';
                                const connected =
                                    ready &&
                                    account &&
                                    chain &&
                                    (!authenticationStatus ||
                                        authenticationStatus === 'authenticated');

                                return (
                                    <div
                                        {...(!ready && {
                                            'aria-hidden': true,
                                            'style': {
                                                opacity: 0,
                                                pointerEvents: 'none',
                                                userSelect: 'none',
                                            },
                                        })}
                                    >
                                        {(() => {
                                            if (!connected) {
                                                return (
                                                    <Button onClick={openConnectModal} className="text-black">
                                                        Connect Wallet
                                                    </Button>
                                                );
                                            }

                                            if (chain.unsupported) {
                                                return (
                                                    <Button onClick={openChainModal} variant="destructive">
                                                        Wrong network
                                                    </Button>
                                                );
                                            }

                                            return (
                                                <div className="flex gap-3">
                                                    <Button
                                                        onClick={openChainModal}
                                                        variant="outline"
                                                        className="text-black"
                                                    >
                                                        {chain.name}
                                                    </Button>
                                                    
                                                    <Button
                                                        onClick={openAccountModal}
                                                        variant="outline"
                                                        className="text-black"
                                                    >
                                                        {account.displayName}
                                                    </Button>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                );
                            }}
                        </ConnectButton.Custom>
                    </div>
                    
                    <div className="flex justify-center">
                        <Button variant="link" asChild className="text-black">
                            <Link 
                                href="https://chronicle-yellowstone-faucet.getlit.dev" 
                                target="_blank"
                                className="flex items-center gap-2"
                            >
                                <span>Get testnet tokens</span>
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}