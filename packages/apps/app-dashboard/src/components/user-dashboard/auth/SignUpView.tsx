import { FC } from 'react';
import { AUTH_METHOD_TYPE } from '@lit-protocol/constants';
import { Button } from '@/components/shared/ui/button';
import StatusMessage from '../consent/StatusMessage';

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
    <>
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
    </>
  );

  const renderStytchView = () => (
    <StatusMessage message={'Creating your account...'} type={'info'} />
  );

  const renderDefaultView = () => (
    <>
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
    </>
  );

  switch (authMethodType) {
    case AUTH_METHOD_TYPE.WebAuthn:
      return renderWebAuthnView();
    case AUTH_METHOD_TYPE.StytchEmailFactorOtp:
    case AUTH_METHOD_TYPE.StytchSmsFactorOtp:
      return renderStytchView();
    default:
      return renderDefaultView();
  }
};

export default SignUpView;
