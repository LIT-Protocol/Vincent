import { useState } from 'react';
import { useSetAuthInfo } from '../../../hooks/user-dashboard/useAuthInfo';
import { Button } from '@/components/shared/ui/button';
import { ThemeType } from '../consent/ui/theme';
import Loading from '@/components/shared/ui/Loading';

interface WebAuthnProps {
  authWithWebAuthn: any;
  setView: React.Dispatch<React.SetStateAction<string>>;
  registerWithWebAuthn?: any;
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
    setLoading(true);
    setError('');
    try {
      await registerWithWebAuthn();
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
        Use passkeys for secure, passwordless login
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <div className="flex flex-col lg:flex-row lg:gap-6 space-y-6 lg:space-y-0">
            {registerWithWebAuthn && (
              <div
                className={`w-full lg:flex-1 mx-auto lg:mx-0 border rounded-lg p-4 ${theme.cardBg} ${theme.cardBorder}`}
              >
                <h2 className={`text-base font-medium mb-1 ${theme.text}`}>
                  Register a new passkey
                </h2>
                <p className={`text-sm mb-3 ${theme.textMuted}`}>Create a new passkey</p>
                <Button
                  className={`py-3 px-4 w-full font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme.accentBg} ${theme.accentHover}`}
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create'}
                </Button>
              </div>
            )}

            <div
              className={`w-full lg:flex-1 mx-auto lg:mx-0 border rounded-lg p-4 ${theme.cardBg} ${theme.cardBorder}`}
            >
              <h2 className={`text-base font-medium mb-1 ${theme.text}`}>Sign in with passkey</h2>
              <p className={`text-sm mb-3 ${theme.textMuted}`}>Use an existing passkey</p>
              <Button
                className={`py-3 px-4 w-full font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme.accentBg} ${theme.accentHover}`}
                onClick={handleAuthenticate}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <div className="w-full sm:w-3/4 md:w-3/4 lg:w-full max-w-2xl">
          <Button
            onClick={handleBackClick}
            className={`${theme.cardBg} ${theme.text} border ${theme.cardBorder} rounded-lg py-3 px-4 w-full font-medium text-sm ${theme.itemHoverBg} transition-colors`}
          >
            Back
          </Button>
        </div>
      </div>
    </>
  );
}
