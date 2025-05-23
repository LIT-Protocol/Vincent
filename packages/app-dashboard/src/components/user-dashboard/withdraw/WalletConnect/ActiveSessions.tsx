import { Button } from '@/components/shared/ui/button';
import { DAppIcon, DAppIconFallback } from './DAppIcon';
import { WalletConnectCard } from './WalletConnectCard';

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

export function ActiveSessions({
  sessions,
  currentWalletAddress,
  onDisconnect,
  disconnecting,
}: ActiveSessionsProps) {
  if (sessions.length === 0) {
    return null;
  }

  const subtitle = currentWalletAddress
    ? `• ${currentWalletAddress.slice(0, 6)}...${currentWalletAddress.slice(-4)}`
    : undefined;

  return (
    <WalletConnectCard variant="sessions" title="Active Connections" icon="🔗" subtitle={subtitle}>
      <div className="space-y-2">
        {sessions.map((session: Session, index) => (
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

  return (
    <div className="flex items-center justify-between gap-2 py-2 px-3 bg-white rounded-md border border-blue-100 shadow-sm transition-all hover:shadow-md">
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
              className="font-medium text-blue-700 hover:text-blue-800 hover:underline"
            >
              {dappName}
            </a>
          ) : (
            <span className="font-medium text-blue-700">{dappName}</span>
          )}
          <span className="text-xs text-blue-400 ml-1 block">
            Session: {sessionTopic.slice(0, 8)}...
          </span>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onDisconnect(sessionTopic)}
        disabled={disconnecting === sessionTopic}
        className="h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
      >
        {disconnecting === sessionTopic ? 'Disconnecting...' : 'Disconnect'}
      </Button>
    </div>
  );
}
