import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Link } from 'react-router-dom';
import { Button } from '@/components/shared/ui/button';
import { useTheme } from '@/hooks/useTheme';

export default function Header() {
  const isDark = useTheme();

  return (
    <div className="flex justify-between items-center p-6 border-b">
      <Link to="/" className="flex items-center">
        <img
          src={isDark ? '/vincent-by-lit-white-logo.png' : '/vincent-by-lit-logo.png'}
          alt="Vincent"
          width={150}
          height={40}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        />
      </Link>
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
