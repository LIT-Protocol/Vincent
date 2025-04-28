import { FC } from 'react';
import { AUTH_METHOD_TYPE } from '@lit-protocol/constants';
import Loading from '../components/Loading';
import { Button } from '@/components/ui/button';
import ProtectedByLit from '@/components/layout/ProtectedByLit';

interface SignUpViewProps {
  authMethodType: (typeof AUTH_METHOD_TYPE)[keyof typeof AUTH_METHOD_TYPE];
  handleRegisterWithWebAuthn?: () => Promise<void>;
  authWithWebAuthn?: () => void;
}

const SignUpView: FC<SignUpViewProps> = ({
  authMethodType,
  handleRegisterWithWebAuthn,
  authWithWebAuthn,
}) => {
  const renderWebAuthnView = () => (
    <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center">
        <div className="h-8 w-8 rounded-md flex items-center justify-center">
          <img src="/logo.svg" alt="Vincent logo" width={20} height={20} />
        </div>
        <div className="ml-3 text-base font-medium text-gray-700">Connect with Vincent</div>
      </div>

      <div className="p-6">
        <h1 className="text-xl font-semibold text-center mb-4">No Accounts Found</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          You don&apos;t have any accounts associated with this WebAuthn credential.
        </p>
        <div className="flex flex-col space-y-3">
          <Button
            className="bg-black text-white rounded-lg py-3 font-medium text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRegisterWithWebAuthn}
          >
            Create New Account
          </Button>
          <Button
            className="bg-white text-gray-700 border border-gray-200 rounded-lg py-3 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={authWithWebAuthn}
          >
            Try Sign In Again
          </Button>
        </div>
      </div>

      <ProtectedByLit />
    </div>
  );

  const renderStytchView = () => <Loading copy={'Creating your account...'} />;

  const renderWalletView = () => (
    <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center">
        <div className="h-8 w-8 rounded-md flex items-center justify-center">
          <img src="/logo.svg" alt="Vincent logo" width={20} height={20} />
        </div>
        <div className="ml-3 text-base font-medium text-gray-700">Connect with Vincent</div>
      </div>

      <div className="p-6">
        <h1 className="text-xl font-semibold text-center mb-4">No Accounts Found</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          No accounts were found for this wallet address.
        </p>
        <Button
          className="bg-white text-gray-700 border border-gray-200 rounded-lg py-3 w-full font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>

      <ProtectedByLit />
    </div>
  );

  const renderDefaultView = () => (
    <div className="bg-white rounded-xl shadow-lg max-w-[550px] w-full mx-auto border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center">
        <div className="h-8 w-8 rounded-md flex items-center justify-center">
          <img src="/logo.svg" alt="Vincent logo" width={20} height={20} />
        </div>
        <div className="ml-3 text-base font-medium text-gray-700">Connect with Vincent</div>
      </div>

      <div className="p-6">
        <h1 className="text-xl font-semibold text-center mb-4">
          Unsupported Authentication Method
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          The authentication method you&apos;re using is not supported.
        </p>
        <Button
          className="bg-white text-gray-700 border border-gray-200 rounded-lg py-3 w-full font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => window.location.reload()}
        >
          Start Over
        </Button>
      </div>

      <ProtectedByLit />
    </div>
  );

  switch (authMethodType) {
    case AUTH_METHOD_TYPE.WebAuthn:
      return renderWebAuthnView();
    case AUTH_METHOD_TYPE.StytchEmailFactorOtp:
    case AUTH_METHOD_TYPE.StytchSmsFactorOtp:
      return renderStytchView();
    case AUTH_METHOD_TYPE.EthWallet:
      return renderWalletView();
    default:
      return renderDefaultView();
  }
};

export default SignUpView;
