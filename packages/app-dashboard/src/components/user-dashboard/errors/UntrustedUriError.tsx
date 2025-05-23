import { useNavigate } from 'react-router';

import { Button } from '@/components/shared/ui/button';
import { AppView } from '@/types';

interface UntrustedUriErrorProps {
  redirectUri: string | null;
  appInfo: AppView | null;
}

const UntrustedUriError = ({ redirectUri, appInfo }: UntrustedUriErrorProps) => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Redirect URI Not Trusted</h2>
        <p className="text-sm text-red-600 mb-3">
          This application is trying to redirect to a URI that is not on its allowlist.
        </p>
        <p className="text-sm text-red-600 mb-3">
          URI: <code className="bg-red-100 px-1 py-0.5 rounded">{redirectUri}</code>
        </p>
        <p className="text-sm text-red-600">
          This could be a sign of a malicious app trying to steal your data. Please contact the app
          developer to resolve this issue.
        </p>
      </div>

      {appInfo && (
        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-2">
            <strong>App Information:</strong>
          </p>
          <ul className="pl-5 text-sm text-gray-600 list-disc">
            <li>Name: {appInfo.appName}</li>
            <li>Description: {appInfo.description}</li>
            <li>Version: {appInfo.latestVersion?.toString() || '1'}</li>
          </ul>
        </div>
      )}

      <Button
        className="w-full bg-black text-white rounded-lg py-3 font-medium text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => navigate('/user/apps')}
      >
        Go Back
      </Button>
    </div>
  );
};

export default UntrustedUriError;
