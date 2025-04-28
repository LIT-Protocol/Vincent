import { FC } from 'react';
import { IRelayPKP } from '@lit-protocol/types';
import { Button } from '@/components/ui/button';
import ProtectedByLit from '@/components/layout/ProtectedByLit';

interface AuthInfo {
  type: string;
  authenticatedAt: string;
  agentPKP?: IRelayPKP;
  userPKP?: IRelayPKP;
  value?: string;
}

interface ExistingAccountViewProps {
  authInfo: AuthInfo | null;
  handleUseExistingAccount: () => void;
  handleSignOut: () => void;
}

const ExistingAccountView: FC<ExistingAccountViewProps> = ({
  authInfo,
  handleUseExistingAccount,
  handleSignOut,
}) => {
  // Function to render auth method information
  const renderAuthMethodInfo = () => {
    if (!authInfo) return null;

    let methodName = '';
    let methodDetails = '';

    switch (authInfo.type) {
      case 'webauthn':
        methodName = 'WebAuthn Passkey';
        break;
      case 'email':
        methodName = 'Email OTP';
        methodDetails = authInfo.value ? `Email: ${authInfo.value}` : '';
        break;
      case 'phone':
        methodName = 'Phone OTP';
        methodDetails = authInfo.value ? `Phone: ${authInfo.value}` : '';
        break;
      default:
        methodName = authInfo.type;
    }

    const authTime = authInfo.authenticatedAt
      ? new Date(authInfo.authenticatedAt).toLocaleString()
      : 'Unknown time';

    // Get PKP Ethereum address for display
    const pkpEthAddress = authInfo.agentPKP?.ethAddress || 'Not available';

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <h4 className="font-medium mb-2">Authentication Method</h4>
        <p>
          <strong>{methodName}</strong>
        </p>
        {methodDetails && <p className="text-sm text-gray-700">{methodDetails}</p>}
        <p className="text-sm text-gray-500 mt-2">Authenticated at: {authTime}</p>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p>
            <strong>EVM Address:</strong>
          </p>
          <p className="text-xs font-mono bg-gray-100 p-2 rounded mt-1 overflow-hidden text-ellipsis">
            {pkpEthAddress}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center">
        <div className="h-8 w-8 rounded-md flex items-center justify-center">
          <img src="/logo.svg" alt="Vincent logo" width={20} height={20} />
        </div>
        <div className="ml-3 text-base font-medium text-gray-700">Connect with Vincent</div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h2 className="text-xl font-semibold text-center mb-4">Use Existing Account?</h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Would you like to use your existing authentication for this session?
        </p>

        {renderAuthMethodInfo()}

        <div className="flex flex-col space-y-3 mt-6">
          <Button
            onClick={handleUseExistingAccount}
            className="bg-black text-white rounded-lg py-3 font-medium text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Yes, Use Existing Account
          </Button>
          <Button
            onClick={handleSignOut}
            className="bg-white text-gray-700 border border-gray-200 rounded-lg py-3 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            No, Sign Out
          </Button>
        </div>
      </div>

      <ProtectedByLit />
    </div>
  );
};

export default ExistingAccountView;
