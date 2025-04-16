import { useState } from 'react';
import { useSetAuthInfo } from '../hooks/useAuthInfo';

interface WebAuthnProps {
  authWithWebAuthn: any;
  setView: React.Dispatch<React.SetStateAction<string>>;
  registerWithWebAuthn?: any;
}

export default function WebAuthn({
  authWithWebAuthn,
  setView,
  registerWithWebAuthn,
}: WebAuthnProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const { setAuthInfo } = useSetAuthInfo();

  async function handleRegister() {
    if (!registerWithWebAuthn) {
      return;
    }
    setLoading(true);
    try {
      await registerWithWebAuthn();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function handleAuthenticate() {
    setLoading(true);
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
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-black animate-spin mb-4"></div>
        <p className="text-sm text-gray-600">Creating your account...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-center text-gray-800 mb-2">Passkey Authentication</h1>
      <p className="text-sm text-gray-600 text-center mb-6">Use passkeys for secure, passwordless login</p>
      
      <div className="space-y-6">
        {registerWithWebAuthn && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-base font-medium text-gray-800 mb-1">Register a new passkey</h2>
            <p className="text-sm text-gray-600 mb-3">Create a new passkey for passwordless authentication</p>
            <button
              type="button"
              className="bg-black text-white rounded-lg py-3 px-4 w-full font-medium text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create a passkey'}
            </button>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-base font-medium text-gray-800 mb-1">Sign in with passkey</h2>
          <p className="text-sm text-gray-600 mb-3">Use your existing passkey to sign in</p>
          <button
            type="button"
            className="bg-black text-white rounded-lg py-3 px-4 w-full font-medium text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAuthenticate}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in with passkey'}
          </button>
        </div>
      </div>
      
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setView('default')}
          className="bg-white text-gray-700 border border-gray-200 rounded-lg py-3 px-4 w-full font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
      </div>
    </>
  );
}
