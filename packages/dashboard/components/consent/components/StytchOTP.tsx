import { useState } from 'react';
import { useStytch } from '@stytch/nextjs';
import { useSetAuthInfo } from '../hooks/useAuthInfo';
import { z } from 'zod';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface StytchOTPProps {
  method: OtpMethod;
  authWithStytch: any;
  setView: React.Dispatch<React.SetStateAction<string>>;
}

type OtpMethod = 'email' | 'phone';
type OtpStep = 'submit' | 'verify';

const codeSchema = z.string()
  .trim()
  .refine(
    (val) => /^\d{6}$/.test(val),
    { message: 'Verification code must be 6 digits' }
  );

/**
 * One-time passcodes can be sent via phone number through Stytch
 */
const StytchOTP = ({ method, authWithStytch, setView }: StytchOTPProps) => {
  const [step, setStep] = useState<OtpStep>('submit');
  const [userId, setUserId] = useState<string>('');
  const [methodId, setMethodId] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const stytchClient = useStytch();
  const { setAuthInfo } = useSetAuthInfo();

  async function sendPasscode(event: any) {
    event.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let response: any;
      
      if (method === 'email') {
        response = await stytchClient.otps.email.loginOrCreate(userId, {
          expiration_minutes: 2,
          login_template_id: 'vincent_v1',
        });
      } else {
        if (!userId) {
          throw new Error('Please enter a valid phone number in international format (e.g. +12025551234)');
        }
        
        response = await stytchClient.otps.sms.loginOrCreate(userId);
      }
      
      setMethodId(response.method_id);
      setStep('verify');
    } catch (err: any) {
      console.error(`Error sending ${method} OTP:`, err);
      
      let errorMessage = 'Failed to send verification code. Please try again.';
      
      if (err.message?.includes('invalid_phone_number')) {
        errorMessage = 'Please enter a valid phone number in international format (e.g. +12025551234)';
      } else if (typeof err.message === 'string') {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function authenticate(event: any) {
    event.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      codeSchema.parse(code);
      
      const response = await stytchClient.otps.authenticate(code, methodId, {
        session_duration_minutes: 60,
      });
      
      try {
        setAuthInfo({
          type: method,
          value: userId,
          userId: response.user_id,
          authenticatedAt: new Date().toISOString()
        });
      } catch (storageError) {
        console.error('Error storing auth info in localStorage:', storageError);
      }
      
      await authWithStytch(response.session_jwt, response.user_id, method);
    } catch (err: any) {
      console.error(`Error authenticating with ${method} OTP:`, err);
      let errorMessage = 'Failed to verify code. Please try again.';
      
      if (err instanceof z.ZodError && err.errors.length > 0) {
        errorMessage = err.errors[0].message;
      } else if (err.message?.includes('invalid_code')) {
        errorMessage = 'Invalid verification code. Please check and try again.';
      } else if (typeof err.message === 'string') {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {step === 'submit' && (
        <>
          <h1>Enter your {method}</h1>
          <p>A verification code will be sent to your {method}.</p>
          <div className="form-wrapper">
            <form className="form" onSubmit={sendPasscode}>
              {method === 'email' ? (
                <>
                  <label htmlFor="email" className="sr-only">Email</label>
                  <input
                    id="email"
                    value={userId}
                    onChange={e => setUserId(e.target.value)}
                    type="email"
                    name="email"
                    className="form__input"
                    placeholder="Your email"
                    autoComplete="off"
                  />
                </>
              ) : (
                <div className="phone-input-container" style={{ marginBottom: '16px' }}>
                  <label htmlFor="phone" className="sr-only">Phone number</label>
                  <PhoneInput
                    id="phone"
                    international
                    defaultCountry="US"
                    value={userId}
                    onChange={value => setUserId(value || '')}
                    className="form__input"
                    placeholder="Your phone number"
                  />
                </div>
              )}
              {error && <div className="error-message" style={{ color: 'red', margin: '8px 0' }}>{error}</div>}
              <button
                type="submit"
                className="btn btn--primary"
                disabled={loading}
                style={{ marginBottom: '4px' }}
              >
                Send code
              </button>
              <button
                onClick={() => setView('default')}
                className="btn btn--outline"
                style={{ marginTop: '0px' }}
              >
                Back
              </button>
            </form>
          </div>
        </>
      )}
      {step === 'verify' && (
        <>
          <h1>Check your {method}</h1>
          <p>Enter the 6-digit verification code to {userId}</p>
          <div className="form-wrapper">
            <form className="form" onSubmit={authenticate}>
              <label htmlFor="code" className="sr-only">
                Code
              </label>
              <input
                id="code"
                value={code}
                onChange={e => setCode(e.target.value)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                name="code"
                className="form__input"
                placeholder="Verification code"
                autoComplete="off"
              ></input>
              {error && <div className="error-message" style={{ color: 'red', margin: '8px 0' }}>{error}</div>}
              <button type="submit" className="btn btn--primary" style={{ marginBottom: '4px' }}>
                Verify
              </button>
              <button
                onClick={() => setStep('submit')}
                className="btn btn--outline"
                style={{ marginTop: '0px' }}
              >
                Try again
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
};

export default StytchOTP;
