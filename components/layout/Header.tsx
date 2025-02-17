"use client";
import { Link, NavigationMenuLink } from "@radix-ui/react-navigation-menu";
import {
    NavigationMenu,
    NavigationMenuList,
} from "@radix-ui/react-navigation-menu";
import { NavigationMenuItem } from "../ui/navigation-menu";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
export default function Header() {
    const pathname = usePathname();

    return (
        <div className="max-w-screen-xl mx-auto p-6 flex justify-between">
            <div>
                <NavigationMenu className="max-w-screen-xl mx-auto">
                    <NavigationMenuList className="flex flex-row gap-4">
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
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild>
                                <Link
                                    href="/registry"
                                    className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                        pathname === "/registry"
                                            ? "bg-black text-white"
                                            : "bg-background hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                >
                                    App Registry
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild>
                                <Link
                                    href="/apps"
                                    className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                        pathname === "/apps"
                                            ? "bg-black text-white"
                                            : "bg-background hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                >
                                    Vincent Apps
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild>
                                <Link
                                    href="/management"
                                    className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                                        pathname === "/management"
                                            ? "bg-black text-white"
                                            : "bg-background hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                >
                                    AW Management
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
            <div>
                <Button>Login</Button>
            </div>
        </div>
    );
}
