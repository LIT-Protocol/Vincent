import { AppView } from '../../types';
import StatusMessage from './StatusMessage';

interface UntrustedUriErrorProps {
  redirectUri: string | null;
  appInfo: AppView | null;
  statusMessage: string;
  statusType: 'info' | 'warning' | 'success' | 'error';
}

const UntrustedUriError = ({
  redirectUri,
  appInfo,
  statusMessage,
  statusType,
}: UntrustedUriErrorProps) => {
  return (
    <div className="p-6">
      <StatusMessage message={statusMessage} type={statusType} />
      
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Redirect URI Not Trusted</h2>
        <p className="text-sm text-red-600 mb-3">
          This application is trying to redirect to a URI that is not on its allowlist.
        </p>
        <p className="text-sm text-red-600 mb-3">
          URI: <code className="bg-red-100 px-1 py-0.5 rounded">{redirectUri}</code>
        </p>
        <p className="text-sm text-red-600">
          This could be a sign of a malicious app trying to steal your data. Please contact the
          app developer to resolve this issue.
        </p>
      </div>
      
      {appInfo && (
        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-2">
            <strong>App Information:</strong>
          </p>
          <ul className="pl-5 text-sm text-gray-600 list-disc">
            <li>Name: {appInfo.name}</li>
            <li>Description: {appInfo.description}</li>
            <li>Version: {appInfo.latestVersion?.toString() || '1'}</li>
          </ul>
        </div>
      )}
      
      <button
        className="w-full bg-black text-white rounded-lg py-3 font-medium text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => window.history.back()}
      >
        Go Back
      </button>
    </div>
  );
};

export default UntrustedUriError; 