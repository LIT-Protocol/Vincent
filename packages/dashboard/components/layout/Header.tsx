'use client';
import { Link, NavigationMenuLink } from '@radix-ui/react-navigation-menu';
import {
  NavigationMenu,
  NavigationMenuList,
} from '@radix-ui/react-navigation-menu';
import { NavigationMenuItem } from '../ui/navigation-menu';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { LitConnectButton } from '@/components/login';
import '@rainbow-me/rainbowkit/styles.css';
import { usePKPAccount } from '@/hooks/usePKPAccount';
import { shortenAddress } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();
  const { currentAccount } = usePKPAccount();

  return (
    <div className="border-b">
      <NavigationMenu className="max-w-screen-xl mx-auto p-6">
        <NavigationMenuList className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
                  href="/"
                  className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    pathname === '/'
                      ? 'bg-black text-white'
                      : 'bg-background hover:bg-accent hover:text-accent-foreground'
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
                    pathname === '/library'
                      ? 'bg-black text-white'
                      : 'bg-background hover:bg-accent hover:text-accent-foreground'
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
                    pathname === '/developer'
                      ? 'bg-black text-white'
                      : 'bg-background hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  Developer
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </div>
          <div className="flex flex-row gap-4">
            <NavigationMenuItem>
              <LitConnectButton />
            </NavigationMenuItem>

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
