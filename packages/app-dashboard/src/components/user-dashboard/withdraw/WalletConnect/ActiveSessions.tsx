import { Button } from '@/components/shared/ui/button';
import { DAppIcon, DAppIconFallback } from './DAppIcon';
import { WalletConnectCard } from './WalletConnectCard';
import { useEffect } from 'react';
import { Link } from 'lucide-react';

type Session = {
  topic: string;
  namespaces: Record<string, unknown>;
  expiry: number;
  acknowledged: boolean;
  controller: string;
  peer: {
    metadata: {
      name: string;
      description: string;
      url: string;
      icons: string[];
    };
  };
  relay: {
    protocol: string;
  };
};

interface ActiveSessionsProps {
  sessions: Session[];
  currentWalletAddress: string | null;
  onDisconnect: (topic: string) => void;
  disconnecting: string | null;
}

// Helper function to extract wallet address from session namespaces
function getSessionWalletAddress(session: Session): string | null {
  try {
    const eip155Namespace = session.namespaces?.eip155 as any;
    if (eip155Namespace?.accounts?.[0]) {
      // Format is "eip155:chainId:address"
      const parts = eip155Namespace.accounts[0].split(':');
      return parts[2] || null;
    }
  } catch (error) {
    console.error('Failed to extract wallet address from session:', error);
  }
  return null;
}

export function ActiveSessions({
  sessions,
  currentWalletAddress,
  onDisconnect,
  disconnecting,
}: ActiveSessionsProps) {
  // Disconnect sessions that don't match current wallet (side effect in useEffect)
  useEffect(() => {
    if (!currentWalletAddress) return;

    sessions.forEach((session) => {
      const sessionWalletAddress = getSessionWalletAddress(session);

      if (
        sessionWalletAddress &&
        sessionWalletAddress.toLowerCase() !== currentWalletAddress.toLowerCase()
      ) {
        console.log(
          `Auto-disconnecting session from different wallet: ${sessionWalletAddress} (current: ${currentWalletAddress})`,
        );
        onDisconnect(session.topic);
      }
    });
  }, [sessions, currentWalletAddress, onDisconnect]);

  if (sessions.length === 0) {
    return null;
  }

  // Filter sessions to only show those that match the current wallet (pure filtering, no side effects)
  const relevantSessions = sessions.filter((session) => {
    const sessionWalletAddress = getSessionWalletAddress(session);
    return sessionWalletAddress?.toLowerCase() === currentWalletAddress?.toLowerCase();
  });

  if (relevantSessions.length === 0) {
    return null;
  }

  return (
    <WalletConnectCard
      variant="sessions"
      title="Active Connections"
      icon={<Link className="w-5 h-5" />}
    >
      <div className="space-y-2">
        {relevantSessions.map((session: Session, index) => (
          <SessionItem
            key={index}
            session={session}
            onDisconnect={onDisconnect}
            disconnecting={disconnecting}
          />
        ))}
      </div>
    </WalletConnectCard>
  );
}

function SessionItem({
  session,
  onDisconnect,
  disconnecting,
}: {
  session: Session;
  onDisconnect: (topic: string) => void;
  disconnecting: string | null;
}) {
  const dappName = session.peer?.metadata?.name || 'Unknown';
  const dappUrl = session.peer?.metadata?.url || null;
  const dappIcon = session.peer?.metadata?.icons?.[0] || null;
  const sessionTopic = session.topic || '';
  const sessionWalletAddress = getSessionWalletAddress(session);

  const walletAddressDisplay = sessionWalletAddress
    ? `• ${sessionWalletAddress.slice(0, 6)}...${sessionWalletAddress.slice(-4)}`
    : '';

  return (
    <div className="flex items-center justify-between gap-2 py-2 px-3 bg-gray-50 rounded-md border border-gray-200 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-2">
        {dappIcon ? (
          <DAppIcon src={dappIcon} alt={`${dappName} logo`} />
        ) : (
          <DAppIconFallback name={dappName} />
        )}
        <div>
          {dappUrl ? (
            <a
              href={dappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gray-700 hover:text-gray-900 hover:underline"
            >
              {dappName}
            </a>
          ) : (
            <span className="font-medium text-gray-700">{dappName}</span>
          )}
          <div className="text-xs text-gray-500">
            <span>Session: {sessionTopic.slice(0, 8)}...</span>
            {walletAddressDisplay && <span className="ml-2">{walletAddressDisplay}</span>}
          </div>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onDisconnect(sessionTopic)}
        disabled={disconnecting === sessionTopic}
        className="h-8 px-3 text-xs border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
      >
        {disconnecting === sessionTopic ? 'Disconnecting...' : 'Disconnect'}
      </Button>
    </div>
  );
}
