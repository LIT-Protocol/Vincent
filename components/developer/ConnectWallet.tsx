import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function ConnectWalletScreen() {
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
    )
}