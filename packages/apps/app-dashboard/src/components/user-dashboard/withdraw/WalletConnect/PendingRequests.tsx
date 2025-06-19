import { Button } from '@/components/shared/ui/button';
import { WalletConnectCard } from './WalletConnectCard';
import { DAppIcon, DAppIconFallback } from './DAppIcon';
import { ethers } from 'ethers';
import { IWalletKit } from '@reown/walletkit';
import { PenTool, Send, FileText, Settings, HelpCircle } from 'lucide-react';

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
    <div className="rounded-md p-3 border shadow-sm transition-all hover:shadow-md bg-gradient-to-r from-cyan-50 to-slate-50 border-cyan-200">
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
              className="text-sm font-medium hover:underline text-cyan-800"
            >
              {dAppInfo.name}
            </a>
          ) : (
            <span className="text-sm font-medium text-cyan-800">{dAppInfo.name}</span>
          )}
        </div>
      </div>

      {/* Request Info */}
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-cyan-800">{icon}</span>}
        <p className="font-medium text-cyan-800">{description}</p>
      </div>

      {details}

      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          variant="outline"
          className="text-xs border-cyan-200 text-cyan-800 hover:bg-cyan-50"
          onClick={onApprove}
          disabled={processing}
        >
          {processing ? 'Processing...' : 'Approve'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs hover:bg-opacity-50 border-cyan-200 text-cyan-800"
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
        <div className="mt-2 p-2 bg-white rounded-md text-gray-800 text-xs font-mono whitespace-pre-wrap border border-gray-200 max-h-24 overflow-auto">
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
        <div className="mt-2 p-2 bg-white rounded-md text-gray-800 text-xs font-mono overflow-auto border border-gray-200">
          <p className="mb-1">
            <span className="text-gray-500">To:</span> {tx.to}
          </p>
          {tx.value && (
            <p className="mb-1">
              <span className="text-gray-500">Value:</span> {valueDisplay}
            </p>
          )}
          {tx.data && tx.data !== '0x' && (
            <div className="mb-1">
              <span className="text-gray-500">Data:</span>
              <div className="mt-1 p-2 bg-gray-50 rounded border max-h-32 overflow-auto break-all">
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
        <div className="mt-2 p-3 bg-white rounded-md text-gray-800 text-xs font-mono overflow-auto border border-gray-200 max-h-48">
          <div className="whitespace-pre-wrap break-words">{typedDataDisplay}</div>
        </div>
      );
      break;
    }

    case 'wallet_getCapabilities': {
      icon = <Settings className="w-4 h-4" />;
      description = 'Get Wallet Capabilities';
      details = (
        <div className="mt-2 p-2 bg-white rounded-md text-gray-800 text-xs font-mono overflow-auto border border-gray-200">
          <p>Request for wallet capabilities</p>
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
