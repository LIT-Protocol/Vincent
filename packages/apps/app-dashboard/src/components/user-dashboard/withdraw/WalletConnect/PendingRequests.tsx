import { Button } from '@/components/shared/ui/button';
import { WalletConnectCard } from './WalletConnectCard';
import { DAppIcon, DAppIconFallback } from './DAppIcon';
import { ethers } from 'ethers';
import { IWalletKit } from '@reown/walletkit';
import { PenTool, Send, FileText, HelpCircle } from 'lucide-react';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

interface PendingRequest {
  id: string;
  topic: string;
  params: {
    request: {
      method: string;
      params: any[];
    };
  };
}

interface PendingRequestsProps {
  requests: PendingRequest[];
  onApprove: (request: PendingRequest) => void;
  onReject: (request: PendingRequest) => void;
  processing: boolean;
  client?: IWalletKit;
}

export function PendingRequests({
  requests,
  onApprove,
  onReject,
  processing,
  client,
}: PendingRequestsProps) {
  if (requests.length === 0) {
    return <></>;
  }

  return (
    <WalletConnectCard variant="requests" title="Pending Requests" className="mb-2">
      <div className="space-y-3">
        {requests.map((request, index) => (
          <RequestItem
            key={`request-${request.id}-${index}`}
            request={request}
            onApprove={() => onApprove(request)}
            onReject={() => onReject(request)}
            processing={processing}
            client={client}
          />
        ))}
      </div>
    </WalletConnectCard>
  );
}

function RequestItem({
  request,
  onApprove,
  onReject,
  processing,
  client,
}: {
  request: PendingRequest;
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
  client?: IWalletKit;
}) {
  const { params, topic } = request;
  const { request: req } = params;
  const { method, params: methodParams } = req;

  const getDAppInfo = () => {
    if (!client) return { name: 'Unknown dApp', icon: null, url: null };

    try {
      const activeSessions = client.getActiveSessions() || {};
      const session = activeSessions[topic];

      if (session?.peer?.metadata) {
        const metadata = session.peer.metadata;
        return {
          name: metadata.name || 'Unknown dApp',
          icon: metadata.icons?.[0] || null,
          url: metadata.url || null,
        };
      }
    } catch (error) {
      console.error('Error getting dApp info:', error);
    }

    return { name: 'Unknown dApp', icon: null, url: null };
  };

  const dAppInfo = getDAppInfo();
  const { description, icon, details } = getRequestInfo(method, methodParams);

  return (
    <div className="rounded-lg p-3 border shadow-sm transition-all hover:shadow-md bg-gray-50 border-gray-200 dark:bg-black/50 dark:border-gray-800">
      {/* dApp Info Header */}
      <div className="flex items-center gap-2 mb-2">
        {dAppInfo.icon ? (
          <DAppIcon src={dAppInfo.icon} alt={`${dAppInfo.name} icon`} size="sm" />
        ) : (
          <DAppIconFallback name={dAppInfo.name} size="sm" />
        )}
        <div className="flex-1">
          {dAppInfo.url ? (
            <a
              href={dAppInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm font-medium hover:underline ${theme.text}`}
              style={fonts.heading}
            >
              {dAppInfo.name}
            </a>
          ) : (
            <span className={`text-sm font-medium ${theme.text}`} style={fonts.heading}>
              {dAppInfo.name}
            </span>
          )}
        </div>
      </div>

      {/* Request Info */}
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className={theme.text}>{icon}</span>}
        <p className={`font-medium ${theme.text}`} style={fonts.heading}>
          {description}
        </p>
      </div>

      {details}

      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          variant="outline"
          className="text-sm border-gray-200 text-gray-800 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-black"
          style={fonts.heading}
          onClick={onApprove}
          disabled={processing}
        >
          {processing ? 'Processing...' : 'Approve'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-sm hover:bg-opacity-50 border-gray-200 text-gray-800 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-black"
          style={fonts.heading}
          onClick={onReject}
          disabled={processing}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}

function getRequestInfo(method: string, methodParams: any[]) {
  let description = '';
  let icon = null;
  let details = null;

  switch (method) {
    case 'personal_sign':
    case 'eth_sign': {
      icon = <PenTool className="w-4 h-4" />;
      description = 'Sign Message';
      const message = methodParams[0];
      const displayMsg =
        typeof message === 'string' && message.startsWith('0x')
          ? Buffer.from(message.slice(2), 'hex').toString('utf8')
          : message;
      details = (
        <div className="mt-2 p-2 bg-white rounded-md text-gray-800 text-xs font-mono whitespace-pre-wrap border border-gray-200 max-h-24 overflow-auto dark:bg-black dark:text-gray-200 dark:border-gray-800">
          {displayMsg}
        </div>
      );
      break;
    }

    case 'eth_sendTransaction': {
      icon = <Send className="w-4 h-4" />;
      description = 'Send Transaction';
      const tx = methodParams[0];

      let valueDisplay = '';
      if (tx.value) {
        try {
          const weiValue = tx.value.toString();
          const ethValue = ethers.utils.formatEther(weiValue);
          const ethFormatted = parseFloat(ethValue)
            .toFixed(6)
            .replace(/\.?0+$/, '');
          valueDisplay = `${ethFormatted} ETH (${weiValue} wei)`;
        } catch (error) {
          valueDisplay = `${tx.value.toString()} wei`;
        }
      }

      details = (
        <div className="mt-2 p-2 bg-white rounded-md text-gray-800 text-xs font-mono overflow-auto border border-gray-200 dark:bg-black dark:text-gray-200 dark:border-gray-800">
          <p className="mb-1">
            <span className="text-gray-500 dark:text-gray-400">To:</span> {tx.to}
          </p>
          {tx.value && (
            <p className="mb-1">
              <span className="text-gray-500 dark:text-gray-400">Value:</span> {valueDisplay}
            </p>
          )}
          {tx.data && tx.data !== '0x' && (
            <div className="mb-1">
              <span className="text-gray-500 dark:text-gray-400">Data:</span>
              <div className="mt-1 p-2 bg-gray-50 rounded border max-h-32 overflow-auto break-all dark:bg-black dark:border-gray-800">
                {tx.data}
              </div>
            </div>
          )}
        </div>
      );
      break;
    }

    case 'eth_signTypedData':
    case 'eth_signTypedData_v4': {
      icon = <FileText className="w-4 h-4" />;
      description = 'Sign Typed Data';

      // Extract the typed data from methodParams[1]
      let typedDataDisplay = 'Structured data signature request';
      try {
        if (methodParams[1]) {
          const typedData =
            typeof methodParams[1] === 'string' ? JSON.parse(methodParams[1]) : methodParams[1];
          typedDataDisplay = JSON.stringify(typedData, null, 2);
        }
      } catch (error) {
        console.error('Error parsing typed data:', error);
        typedDataDisplay = 'Error parsing typed data';
      }

      details = (
        <div className="mt-2 p-3 bg-white rounded-md text-gray-800 text-xs font-mono overflow-auto border border-gray-200 max-h-48 dark:bg-black dark:text-gray-200 dark:border-gray-800">
          <div className="whitespace-pre-wrap break-words">{typedDataDisplay}</div>
        </div>
      );
      break;
    }

    default: {
      icon = <HelpCircle className="w-4 h-4" />;
      description = `Request: ${method}`;
      break;
    }
  }

  return { description, icon, details };
}
