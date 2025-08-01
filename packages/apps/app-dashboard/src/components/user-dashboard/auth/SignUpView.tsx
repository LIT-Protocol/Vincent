import { FC } from 'react';
import { AUTH_METHOD_TYPE } from '@lit-protocol/constants';
import { Button } from '@/components/shared/ui/button';
import { ThemeType } from '../connect/ui/theme';
import StatusMessage from '../connect/StatusMessage';

interface SignUpViewProps {
  authMethodType: (typeof AUTH_METHOD_TYPE)[keyof typeof AUTH_METHOD_TYPE];
  handleRegisterWithWebAuthn?: (displayName: string) => Promise<void>;
  authWithWebAuthn?: () => void;
  theme: ThemeType;
}

const SignUpView: FC<SignUpViewProps> = ({
  authMethodType,
  handleRegisterWithWebAuthn,
  authWithWebAuthn,
  theme,
}) => {
  const renderWebAuthnView = () => (
    <>
      <h1 className={`text-xl font-semibold text-center mb-4 ${theme.text}`}>No Accounts Found</h1>
      <p className={`text-sm text-center mb-6 ${theme.textMuted}`}>
        You don&apos;t have any accounts associated with this WebAuthn credential.
      </p>
      <div className="flex flex-col space-y-3">
        <Button
          className={`${theme.accentBg} rounded-lg py-3 font-medium text-sm ${theme.accentHover} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={() => handleRegisterWithWebAuthn?.('Vincent User')}
        >
          Create New Account
        </Button>
        <Button
          className={`${theme.cardBg} ${theme.text} border ${theme.cardBorder} rounded-lg py-3 font-medium text-sm ${theme.itemHoverBg} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
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
        <h1 className={`text-xl font-semibold text-center mb-4 ${theme.text}`}>
          Unsupported Authentication Method
        </h1>
        <p className={`text-sm text-center mb-6 ${theme.textMuted}`}>
          The authentication method you&apos;re using is not supported.
        </p>
        <Button
          className={`${theme.cardBg} ${theme.text} border ${theme.cardBorder} rounded-lg py-3 w-full font-medium text-sm ${theme.itemHoverBg} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
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
