import { ConnectButton } from '@rainbow-me/rainbowkit';

import { Button } from '@/components/shared/ui/button';

export default function Header() {
  return (
    <div className="flex justify-between items-center p-6 border-b">
      <a href="/" className="flex items-center">
        <img src="/vincent-by-lit-logo.png" alt="Vincent" width={150} height={40} />
      </a>
      <ConnectButton.Custom>
        {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
          if (!mounted) {
            return null;
          }

          return (
            <Button onClick={openConnectModal} variant="default">
              {!account && !chain && 'Connect Wallet'}
              {account && chain && (
                <div onClick={openAccountModal} className="flex items-center gap-2">
                  {account.displayName}
                  {account.displayBalance ? ` (${account.displayBalance})` : ''}
                </div>
              )}
            </Button>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}
