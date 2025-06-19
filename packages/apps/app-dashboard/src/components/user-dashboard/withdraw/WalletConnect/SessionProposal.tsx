import { Button } from '@/components/shared/ui/button';
import { DAppIcon, DAppIconFallback } from './DAppIcon';
import { WalletConnectCard } from './WalletConnectCard';
import { UserPlus } from 'lucide-react';

type SessionMetadata = {
  name: string;
  description: string;
  url: string;
  icons: string[];
};

type Proposal = {
  id: number;
  params: {
    requiredNamespaces: Record<string, any>;
    optionalNamespaces: Record<string, any>;
    proposer: {
      metadata: SessionMetadata;
    };
  };
};

interface SessionProposalProps {
  proposal: Proposal;
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
  walletRegistered: boolean;
}

export function SessionProposal({
  proposal,
  onApprove,
  onReject,
  processing,
  walletRegistered,
}: SessionProposalProps) {
  const dappMetadata = proposal?.params?.proposer?.metadata || {};
  const dappName = dappMetadata.name || 'Unknown';
  const dappUrl = dappMetadata.url || '';
  const dappDescription = dappMetadata.description || '';
  const dappIcon = dappMetadata.icons?.[0] || '';

  const permissions = extractPermissions(proposal);

  return (
    <WalletConnectCard
      variant="proposal"
      title="New Connection Request"
      icon={<UserPlus className="w-5 h-5" />}
      className="mt-3"
    >
      {/* DApp Info */}
      <div className="flex items-start mb-3 p-2 bg-white rounded-md border border-purple-100">
        {dappIcon ? (
          <DAppIcon
            src={dappIcon}
            alt={`${dappName} icon`}
            size="md"
            className="mr-3 flex-shrink-0"
          />
        ) : (
          <DAppIconFallback name={dappName} size="md" className="mr-3 flex-shrink-0" />
        )}
        <div>
          <p className="font-semibold text-purple-900">{dappName}</p>
          {dappUrl && <p className="text-xs text-purple-600">{dappUrl}</p>}
          {dappDescription && <p className="text-xs mt-1 text-purple-700">{dappDescription}</p>}
        </div>
      </div>

      {/* Permissions */}
      {permissions.length > 0 && (
        <div className="mb-3 p-2 bg-white rounded-md border border-purple-100">
          <p className="font-medium mb-2 text-purple-900">Requesting permission to:</p>
          <ul className="list-disc ml-5 text-xs space-y-1 text-purple-800">
            {permissions.map((permission, i) => (
              <li key={i}>{permission}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <Button
          size="sm"
          variant="outline"
          onClick={onApprove}
          disabled={processing || !walletRegistered}
          data-testid="approve-session-button"
          className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
        >
          {processing ? 'Processing...' : 'Approve Connection'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReject}
          disabled={processing}
          data-testid="reject-session-button"
          className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
        >
          Reject
        </Button>
      </div>
    </WalletConnectCard>
  );
}

function extractPermissions(proposal: Proposal): string[] {
  const permissions: string[] = [];

  try {
    const requiredNamespaces = proposal?.params?.requiredNamespaces || {};
    const optionalNamespaces = proposal?.params?.optionalNamespaces || {};

    const extractPermissionsFromNamespaces = (
      namespaces: Record<string, { chains?: string[]; methods?: string[] }>,
      isOptional = false,
    ) => {
      Object.entries(namespaces).forEach(([key, value]) => {
        const namespace = key;
        const chains = value.chains || [];
        const methods = value.methods || [];

        if (chains.length > 0) {
          permissions.push(
            `${isOptional ? '(Optional) ' : ''}Access to ${namespace} chains: ${chains.join(', ')}`,
          );
        }

        if (methods.length > 0) {
          const readMethods = methods.filter(
            (m) => m.startsWith('eth_') && (m.includes('get') || m.includes('accounts')),
          );
          const signMethods = methods.filter((m) => m.includes('sign'));
          const walletMethods = methods.filter((m) => m.startsWith('wallet_'));
          const otherMethods = methods.filter(
            (m) =>
              !readMethods.includes(m) && !signMethods.includes(m) && !walletMethods.includes(m),
          );

          if (readMethods.length) {
            permissions.push(
              `${isOptional ? '(Optional) ' : ''}Read access: ${readMethods.map((m) => m.replace('eth_', '')).join(', ')}`,
            );
          }

          if (signMethods.length) {
            permissions.push(`${isOptional ? '(Optional) ' : ''}Sign transactions/messages`);
          }

          if (walletMethods.length) {
            permissions.push(
              `${isOptional ? '(Optional) ' : ''}Wallet operations: ${walletMethods.map((m) => m.replace('wallet_', '')).join(', ')}`,
            );
          }

          if (otherMethods.length) {
            permissions.push(
              `${isOptional ? '(Optional) ' : ''}Other methods: ${otherMethods.join(', ')}`,
            );
          }
        }
      });
    };

    if (Object.keys(requiredNamespaces).length > 0) {
      extractPermissionsFromNamespaces(requiredNamespaces);
    }

    if (Object.keys(optionalNamespaces).length > 0) {
      extractPermissionsFromNamespaces(optionalNamespaces, true);
    }
  } catch (e) {
    console.error('Error extracting permissions:', e);
  }

  return permissions;
}
