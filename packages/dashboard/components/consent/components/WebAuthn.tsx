import { useState } from 'react';

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
        const authInfo = {
          type: 'webauthn',
          authenticatedAt: new Date().toISOString(),
        };
        
        console.log('Storing basic WebAuthn information in localStorage:', authInfo);
        localStorage.setItem('lit-auth-info', JSON.stringify(authInfo));
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
      <>
        <div className="loader-container">
          <div className="loader"></div>
          <p>Follow the prompts to continue...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="auth-options">
        {registerWithWebAuthn && (
          <div className="auth-option">
            <h2>Register with a passkey</h2>
            <p>Create a new passkey for passwordless authentication.</p>
            <button
              type="button"
              className={`btn btn--primary ${loading && 'btn--loading'}`}
              onClick={handleRegister}
              disabled={loading}
            >
              Create a credential
            </button>
          </div>
        )}

        <div className="auth-option">
          <h2>Sign in with passkey</h2>
          <p>Use your existing passkey to sign in.</p>
          <button
            type="button"
            className={`btn btn--primary ${loading && 'btn--loading'}`}
            onClick={handleAuthenticate}
            disabled={loading}
          >
            Sign in with passkey
          </button>
        </div>
      </div>
      
      <button
        onClick={() => setView('default')}
        className="btn btn--outline"
        style={{ marginTop: '8px' }}
      >
        Back
      </button>
    </>
  );
}
