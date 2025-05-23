import { Button } from '@/components/ui/button';
import { WalletConnectCard } from './WalletConnectCard';

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
}

export function PendingRequests({
  requests,
  onApprove,
  onReject,
  processing,
}: PendingRequestsProps) {
  if (requests.length === 0) {
    return <></>;
  }

  return (
    <WalletConnectCard
      variant="requests"
      title={`Pending Requests (${requests.length})`}
      className="mb-2"
    >
      <div className="space-y-3">
        {requests.map((request, index) => (
          <RequestItem
            key={`request-${request.id}-${index}`}
            request={request}
            onApprove={() => onApprove(request)}
            onReject={() => onReject(request)}
            processing={processing}
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
}: {
  request: PendingRequest;
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
}) {
  const { params } = request;
  const { request: req } = params;
  const { method, params: methodParams } = req;

  const { description, icon, details } = getRequestInfo(method, methodParams);

  return (
    <div className="bg-white rounded-md p-3 border border-orange-100 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-2">
        <span className="text-lg" role="img" aria-label="Request icon">
          {icon}
        </span>
        <p className="font-medium text-orange-900">{description}</p>
      </div>
      {details}
      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          variant="default"
          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 border-0 text-xs"
          onClick={onApprove}
          disabled={processing}
        >
          {processing ? 'Processing...' : 'Approve'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
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
  let icon = '';
  let details = null;

  switch (method) {
    case 'personal_sign':
    case 'eth_sign': {
      icon = '✍️';
      description = 'Sign Message';
      const message = methodParams[0];
      const displayMsg =
        typeof message === 'string' && message.startsWith('0x')
          ? Buffer.from(message.slice(2), 'hex').toString('utf8')
          : message;
      details = (
        <div className="mt-2 p-2 bg-white rounded-md text-gray-800 text-xs font-mono whitespace-pre-wrap border border-orange-100 max-h-24 overflow-auto">
          {displayMsg}
        </div>
      );
      break;
    }

    case 'eth_sendTransaction': {
      icon = '💸';
      description = 'Send Transaction';
      const tx = methodParams[0];
      details = (
        <div className="mt-2 p-2 bg-white rounded-md text-gray-800 text-xs font-mono overflow-auto border border-orange-100">
          <p className="mb-1">
            <span className="text-gray-500">To:</span> {tx.to}
          </p>
          {tx.value && (
            <p className="mb-1">
              <span className="text-gray-500">Value:</span> {tx.value.toString()} wei
            </p>
          )}
          {tx.data && tx.data !== '0x' && (
            <p>
              <span className="text-gray-500">Data:</span> {tx.data.slice(0, 20)}...
            </p>
          )}
        </div>
      );
      break;
    }

    case 'eth_signTypedData':
    case 'eth_signTypedData_v4': {
      icon = '📝';
      description = 'Sign Typed Data';
      details = (
        <div className="mt-2 p-2 bg-white rounded-md text-gray-800 text-xs font-mono overflow-auto border border-orange-100">
          <p>Structured data signature request</p>
        </div>
      );
      break;
    }

    case 'wallet_getCapabilities': {
      icon = '🔍';
      description = 'Get Wallet Capabilities';
      details = (
        <div className="mt-2 p-2 bg-white rounded-md text-gray-800 text-xs font-mono overflow-auto border border-orange-100">
          <p>Request for wallet capabilities</p>
        </div>
      );
      break;
    }

    default: {
      icon = '🔄';
      description = `Request: ${method}`;
      break;
    }
  }

  return { description, icon, details };
}
