'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <div className="border-b">
      <div className="max-w-screen-xl mx-auto p-6">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="Vincent Logo" 
              width={150}
              height={40}
              priority
            />
          </Link>
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openConnectModal,
              mounted,
            }) => {
              if (!mounted) {
                return null;
              }

              return (
                <button
                  onClick={openConnectModal}
                  className="bg-black text-white px-4 py-2 rounded-md hover:bg-black/90 transition-colors"
                >
                  {!account && !chain && 'Connect Wallet'}
                  {account && chain && (
                    <div onClick={openAccountModal} className="flex items-center gap-2">
                      {account.displayName}
                      {account.displayBalance ? ` (${account.displayBalance})` : ''}
                    </div>
                  )}
                </button>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </div>
  );
}
