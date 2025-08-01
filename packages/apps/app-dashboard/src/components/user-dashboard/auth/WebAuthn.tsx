import { useState } from 'react';
import { useSetAuthInfo } from '../../../hooks/user-dashboard/useAuthInfo';
import { Button } from '@/components/shared/ui/button';
import { ThemeType } from '../connect/ui/theme';
import Loading from '@/components/shared/ui/Loading';
import StatusMessage from '../connect/StatusMessage';
import { PasskeyNameInput } from '@/components/shared/ui/PasskeyNameInput';

interface WebAuthnProps {
  authWithWebAuthn: any;
  setView: React.Dispatch<React.SetStateAction<string>>;
  registerWithWebAuthn?: (displayName: string) => Promise<void>;
  clearError?: () => void;
  theme: ThemeType;
}

export default function WebAuthn({
  authWithWebAuthn,
  setView,
  registerWithWebAuthn,
  clearError,
  theme,
}: WebAuthnProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [passkeyName, setPasskeyName] = useState<string>('Vincent Passkey');
  const { setAuthInfo } = useSetAuthInfo();

  const handleBackClick = () => {
    // Clear the error from the parent component when going back
    if (clearError) {
      clearError();
    }
    setView('default');
  };

  async function handleRegister() {
    if (!registerWithWebAuthn) {
      return;
    }

    if (!passkeyName.trim()) {
      setError('Please enter a name for your passkey');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await registerWithWebAuthn(passkeyName.trim());
      // Clear the input after successful registration
      setPasskeyName('');
    } catch (err) {
      console.error(err);
      let errorMessage = '';

      if (err instanceof Error) {
        const errorText = err.message;
        // Don't show errors for user cancellation - it's not really an error
        if (
          errorText.includes('timed out') ||
          errorText.includes('not allowed') ||
          errorText.includes('cancelled') ||
          errorText.includes('privacy-considerations-client')
        ) {
          // User cancelled - silently ignore
        } else {
          errorMessage = 'Failed to create passkey. Please try again.';
        }
      } else {
        errorMessage = 'Failed to create passkey. Please try again.';
      }

      setError(errorMessage);
    }
    setLoading(false);
  }

  async function handleAuthenticate() {
    setLoading(true);
    setError('');
    try {
      await authWithWebAuthn();

      // Store WebAuthn information in localStorage with a basic entry
      // since the response is undefined
      try {
        setAuthInfo({
          type: 'webauthn',
          authenticatedAt: new Date().toISOString(),
        });
      } catch (storageError) {
        console.error('Error storing WebAuthn info in localStorage:', storageError);
      }
    } catch (err) {
      console.error(err);
      let errorMessage = '';

      if (err instanceof Error) {
        const errorText = err.message;
        // Don't show errors for user cancellation - it's not really an error
        if (
          errorText.includes('timed out') ||
          errorText.includes('not allowed') ||
          errorText.includes('cancelled') ||
          errorText.includes('privacy-considerations-client')
        ) {
          // User cancelled - silently ignore
        } else {
          errorMessage = 'Failed to authenticate with passkey. Please try again.';
        }
      } else {
        errorMessage = 'Failed to authenticate with passkey. Please try again.';
      }

      setError(errorMessage);
    }
    setLoading(false);
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <h1 className={`text-xl font-semibold text-center mb-2 ${theme.text}`}>
        Passkey Authentication
      </h1>
      <p className={`text-sm text-center mb-6 ${theme.textMuted}`}>
        Use passkeys for secure, passwordless connection
      </p>

      <div className="flex justify-center">
        <div className="space-y-4 w-4/5">
          {registerWithWebAuthn && (
            <div className="space-y-2">
              <label className={`text-sm font-medium block ${theme.text}`}>
                Passkey name
                <span className="text-red-500 ml-1">*</span>
              </label>
              <PasskeyNameInput
                value={passkeyName}
                onChange={setPasskeyName}
                placeholder="Vincent Passkey"
                className="mb-0"
                label=""
                description=""
                required={true}
              />
            </div>
          )}

          {error && <StatusMessage message={error} type="error" />}

          <div className="pt-2 space-y-3">
            {registerWithWebAuthn && (
              <Button
                className={`${theme.accentBg} rounded-lg py-3 px-4 w-full font-medium text-sm ${theme.accentHover} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={handleRegister}
                disabled={loading || !passkeyName.trim()}
              >
                {loading ? 'Creating...' : 'Create new passkey'}
              </Button>
            )}

            <Button
              className={`${theme.accentBg} rounded-lg py-3 px-4 w-full font-medium text-sm ${theme.accentHover} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={handleAuthenticate}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in with existing passkey'}
            </Button>

            <Button
              onClick={handleBackClick}
              className={`${theme.cardBg} ${theme.text} border ${theme.cardBorder} rounded-lg py-3 px-4 w-full font-medium text-sm ${theme.itemHoverBg} transition-colors`}
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
