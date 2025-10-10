import { Button } from '@/components/shared/ui/button';
import { DAppIcon, DAppIconFallback } from './DAppIcon';
import { WalletConnectCard } from './WalletConnectCard';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { useState } from 'react';

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
  const [showPermissions, setShowPermissions] = useState(false);
  const dappMetadata = proposal?.params?.proposer?.metadata || {};
  const dappName = dappMetadata.name || 'Unknown';
  const dappUrl = dappMetadata.url || '';
  const dappDescription = dappMetadata.description || '';
  const dappIcon = dappMetadata.icons?.[0] || '';

  const permissions = extractPermissions(proposal);

  return (
    <WalletConnectCard variant="proposal" title="New Connection Request" className="mt-3">
      {/* DApp Info */}
      <div className="flex flex-col mb-3">
        <div className="flex items-start">
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
            <p className={`font-semibold ${theme.text}`} style={fonts.heading}>
              {dappName}
            </p>
            {dappUrl && (
              <p className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                {dappUrl}
              </p>
            )}
            {dappDescription && (
              <p className={`text-xs mt-1 ${theme.textMuted}`} style={fonts.body}>
                {dappDescription}
              </p>
            )}
          </div>
        </div>

        {/* Permissions Dropdown within DApp Info */}
        {permissions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowPermissions(!showPermissions)}
              className={`w-full flex items-center justify-between p-1 rounded hover:${theme.itemHoverBg} transition-colors`}
            >
              <span className={`font-medium text-xs ${theme.text}`} style={fonts.heading}>
                Requesting permission to:
              </span>
              {showPermissions ? (
                <ChevronUp className={`w-3 h-3 ${theme.textMuted}`} />
              ) : (
                <ChevronDown className={`w-3 h-3 ${theme.textMuted}`} />
              )}
            </button>
            {showPermissions && (
              <div className={`mt-2 p-2`}>
                <ul
                  className={`list-disc ml-4 text-xs space-y-1 ${theme.textMuted}`}
                  style={fonts.body}
                >
                  {permissions.map((permission, i) => (
                    <li key={i}>{permission}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 justify-center">
          <Button
            size="sm"
            variant="outline"
            onClick={onApprove}
            disabled={processing || !walletRegistered}
            data-testid="approve-session-button"
            className={`text-sm border ${theme.cardBorder} ${theme.text} hover:${theme.itemHoverBg}`}
            style={fonts.heading}
          >
            {processing ? 'Processing...' : 'Approve Connection'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            disabled={processing}
            data-testid="reject-session-button"
            className={`text-sm border ${theme.cardBorder} ${theme.text} hover:${theme.itemHoverBg}`}
            style={fonts.heading}
          >
            Reject
          </Button>
        </div>
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
