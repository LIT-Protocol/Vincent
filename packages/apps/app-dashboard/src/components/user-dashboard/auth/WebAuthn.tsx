import { useState } from 'react';
import { useSetAuthInfo } from '../../../hooks/user-dashboard/useAuthInfo';
import { Button } from '@/components/shared/ui/button';
import { ThemeType } from '../connect/ui/theme';
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
  const [registerLoading, setRegisterLoading] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
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

    setRegisterLoading(true);
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
    setRegisterLoading(false);
  }

  async function handleAuthenticate() {
    setAuthLoading(true);
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
    setAuthLoading(false);
  }

  return (
    <>
      <div className="flex justify-center">
        <div className="space-y-4 w-4/5">
          {registerWithWebAuthn && (
            <div className="space-y-2">
              <label className={`text-sm font-medium block ${theme.text}`}>
                Passkey Name
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
                theme={theme}
              />
            </div>
          )}

          {error && <StatusMessage message={error} type="error" />}

          <div className="pt-2">
            {registerWithWebAuthn && (
              <Button
                className={`${theme.accentBg} rounded-xl py-3 px-4 w-full font-medium text-sm ${theme.accentHover} transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                onClick={handleRegister}
                disabled={registerLoading || authLoading || !passkeyName.trim()}
              >
                {registerLoading ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Create new passkey
                  </>
                )}
              </Button>
            )}

            <Button
              className={`${theme.accentBg} rounded-xl py-3 px-4 w-full font-medium text-sm ${theme.accentHover} transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${registerWithWebAuthn ? 'mt-3' : ''}`}
              onClick={handleAuthenticate}
              disabled={authLoading || registerLoading}
            >
              {authLoading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  Sign in with existing passkey
                </>
              )}
            </Button>

            <Button
              onClick={handleBackClick}
              className={`${theme.cardBg} ${theme.text} border ${theme.cardBorder} rounded-xl py-3 px-4 w-full font-medium text-sm ${theme.itemHoverBg} transition-all duration-200 hover:shadow-sm flex items-center justify-center gap-2 mt-3`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
