"use client";
import { Link, NavigationMenuLink } from "@radix-ui/react-navigation-menu";
import {
    NavigationMenu,
    NavigationMenuList,
} from "@radix-ui/react-navigation-menu";
import { NavigationMenuItem } from "../ui/navigation-menu";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

export default function Header() {
    const pathname = usePathname();

    const CustomConnectButton = () => {
        return (
        <ConnectButton.Custom>
            {({
                account,
                chain,
                openConnectModal,
                openChainModal,
                openAccountModal,
                mounted,
            }) => {
                const ready = mounted;
                if (!ready) return null;

                return (
                    <div>
                        {!account && (
                            <Button
                                variant="outline"
                                onClick={openConnectModal}
                            >
                                Connect Wallet
                            </Button>
                        )}
                        {account && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={openChainModal}
                                    className="flex gap-2 items-center"
                                >
                                    {chain && (
                                        <div className="h-4 w-4">
                                            {chain.hasIcon && chain.iconUrl && (
                                                <img
                                                    alt={chain.name}
                                                    src={chain.iconUrl}
                                                    className="h-full w-full"
                                                />
                                            )}
                                        </div>
                                    )}
                                    {chain?.name || "Unknown Chain"}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={openAccountModal}
                                    className="flex gap-2 items-center"
                                >
                                    {account.displayName}
                                </Button>
                            </div>
                        )}
                    </div>
                );
            }}
        </ConnectButton.Custom>
        );
    };

    return (
        <div className="max-w-screen-xl mx-auto p-6">
            <NavigationMenu className="max-w-screen-xl mx-auto">
                <NavigationMenuList className="flex justify-between">
                    <div className="flex flex-row gap-4">
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild>
                                <Link
                                    href="/"
                                    className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                        pathname === "/"
                                            ? "bg-black text-white"
                                            : "bg-background hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                >
                                    Home
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                        {/* <NavigationMenuItem>
                            <NavigationMenuLink asChild>
                                <Link
                                    href="/explore"
                                    className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                        pathname === "/explore"
                                            ? "bg-black text-white"
                                            : "bg-background hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                >
                                    Explore
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem> */}
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild>
                                <Link
                                    href="/library"
                                    className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                        pathname === "/library"
                                            ? "bg-black text-white"
                                            : "bg-background hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                >
                                    Library
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                        {/* <NavigationMenuItem>
                            <NavigationMenuLink asChild>
                                <Link
                                    href="/aw-management"
                                    className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                        pathname === "/aw-management"
                                            ? "bg-black text-white"
                                            : "bg-background hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                >
                                    AW Management
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem> */}
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild>
                                <Link
                                    href="/developer"
                                    className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                        pathname === "/developer"
                                            ? "bg-black text-white"
                                            : "bg-background hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                >
                                    Developer
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    </div>
                    <div className="flex flex-row gap-4">
                        {pathname === "/developer" ? (
                            <NavigationMenuItem>
                                <CustomConnectButton />
                            </NavigationMenuItem>
                        ) : (
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link
                                        href="/auth"
                                        className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                            pathname === "/auth"
                                                ? "bg-black text-white"
                                                : "bg-background hover:bg-accent hover:text-accent-foreground"
                                        }`}
                                    >
                                        Login
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        )}
                        {/* <NavigationMenuItem>
                            <NavigationMenuLink asChild>
                                <Link
                                    href="/accounts"
                                    className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                        pathname === "/accounts"
                                            ? "bg-black text-white"
                                            : "bg-background hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                >
                                    Accounts
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem> */}
                    </div>
                </NavigationMenuList>
            </NavigationMenu>
        </div>
    );
}
