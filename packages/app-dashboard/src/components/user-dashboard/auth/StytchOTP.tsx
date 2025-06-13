import { useState } from 'react';
import { useStytch } from '@stytch/react';
import { useSetAuthInfo } from '../../../hooks/user-dashboard/useAuthInfo';
import { z } from 'zod';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Button } from '@/components/shared/ui/button';

interface StytchOTPProps {
  method: OtpMethod;
  authWithStytch: any;
  setView: React.Dispatch<React.SetStateAction<string>>;
}

type OtpMethod = 'email' | 'phone';
type OtpStep = 'submit' | 'verify';

const codeSchema = z
  .string()
  .trim()
  .refine((val) => /^\d{6}$/.test(val), { message: 'Verification code must be 6 digits' });

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
          signup_template_id: 'vincent_v1_signup',
        });
      } else {
        if (!userId) {
          throw new Error(
            'Please enter a valid phone number in international format (e.g. +12025551234)',
          );
        }

        response = await stytchClient.otps.sms.loginOrCreate(userId);
      }

      setMethodId(response.method_id);
      setStep('verify');
    } catch (err: any) {
      console.error(`Error sending ${method} OTP:`, err);

      let errorMessage = 'Failed to send verification code. Please try again.';

      if (err.error_type || err.message) {
        const errorType = err.error_type || '';
        const errorMessage_raw = err.message || '';

        if (
          errorType === 'user_lock_limit_reached' ||
          errorMessage_raw.includes('user_lock_limit_reached')
        ) {
          errorMessage = 'Too many failed attempts. Please wait a few minutes before trying again.';
        } else if (errorType === 'rate_limit_exceeded' || errorMessage_raw.includes('rate_limit')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (errorMessage_raw.includes('invalid_phone_number')) {
          errorMessage =
            'Please enter a valid phone number in international format (e.g. +12025551234)';
        } else if (errorMessage_raw.includes('invalid_email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (typeof errorMessage_raw === 'string' && errorMessage_raw.length > 0) {
          // Clean up other API errors
          if (
            errorMessage_raw.includes('[429]') ||
            errorMessage_raw.includes('[4') ||
            errorMessage_raw.includes('request-id')
          ) {
            // Extract meaningful part before technical details
            if (errorMessage_raw.includes('too many')) {
              errorMessage = 'Too many attempts. Please wait a few minutes before trying again.';
            } else if (errorMessage_raw.includes('locked')) {
              errorMessage =
                'Account temporarily locked. Please wait a few minutes before trying again.';
            } else {
              errorMessage = 'Unable to send verification code. Please try again later.';
            }
          } else {
            errorMessage = errorMessage_raw;
          }
        }
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
          authenticatedAt: new Date().toISOString(),
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
      } else if (err.error_type || err.message) {
        const errorType = err.error_type || '';
        const errorMessage_raw = err.message || '';

        if (errorType === 'otp_code_not_found' || errorMessage_raw.includes('otp_code_not_found')) {
          errorMessage = 'Incorrect verification code. Please check and try again.';
        } else if (errorType === 'otp_code_expired' || errorMessage_raw.includes('expired')) {
          errorMessage = 'Verification code has expired. Please request a new one.';
        } else if (errorType === 'too_many_attempts' || errorMessage_raw.includes('too_many')) {
          errorMessage = 'Too many incorrect attempts. Please request a new code.';
        } else if (errorMessage_raw.includes('invalid_code')) {
          errorMessage = 'Invalid verification code. Please check and try again.';
        } else if (typeof errorMessage_raw === 'string' && errorMessage_raw.length > 0) {
          if (errorMessage_raw.includes('[404]') || errorMessage_raw.includes('request-id')) {
            errorMessage = 'Incorrect verification code. Please check and try again.';
          } else {
            errorMessage = errorMessage_raw;
          }
        }
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
          <h1 className="text-xl font-semibold text-center text-gray-800 mb-2">
            Enter your {method}
          </h1>
          <p className="text-sm text-gray-600 text-center mb-6">
            A verification code will be sent to your {method}
          </p>

          <div className="w-full">
            <form className="space-y-4" onSubmit={sendPasscode}>
              {method === 'email' ? (
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700 block">
                    Email address
                  </label>
                  <input
                    id="email"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    type="email"
                    name="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-700 block">
                    Phone number
                  </label>
                  <div className="phone-input-container">
                    <PhoneInput
                      id="phone"
                      international
                      defaultCountry="US"
                      value={userId}
                      onChange={(value) => setUserId(value || '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  className="bg-black text-white rounded-lg py-3 px-4 w-full font-medium text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send code'}
                </Button>

                <Button
                  onClick={() => setView('default')}
                  className="bg-white text-gray-700 border border-gray-200 rounded-lg py-3 px-4 w-full font-medium text-sm hover:bg-gray-50 transition-colors mt-3"
                >
                  Back
                </Button>
              </div>
            </form>
          </div>
        </>
      )}

      {step === 'verify' && (
        <>
          <h1 className="text-xl font-semibold text-center text-gray-800 mb-2">
            Check your {method}
          </h1>
          <p className="text-sm text-gray-600 text-center mb-6">
            Enter the 6-digit verification code sent to {userId}
          </p>

          <div className="w-full">
            <form className="space-y-4" onSubmit={authenticate}>
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium text-gray-700 block">
                  Verification code
                </label>
                <input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  name="code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center tracking-widest text-lg"
                  placeholder="000000"
                  autoComplete="one-time-code"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  className="bg-black text-white rounded-lg py-3 px-4 w-full font-medium text-sm hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify code'}
                </Button>

                <Button
                  onClick={() => setStep('submit')}
                  className="bg-white text-gray-700 border border-gray-200 rounded-lg py-3 px-4 w-full font-medium text-sm hover:bg-gray-50 transition-colors mt-3"
                >
                  Try again
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
};

export default StytchOTP;
