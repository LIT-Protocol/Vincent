import { useState, useEffect } from 'react';
import { useStytch } from '@stytch/react';
import { z } from 'zod';
import { Button } from '@/components/shared/ui/button';
import { ThemeType, fonts } from '../connect/ui/theme';
import StatusMessage from '../connect/StatusMessage';
import { countryCodes } from '@/utils/user-dashboard/countryCodes';
import CountryCodeSelector from '@/components/shared/ui/CountryCodeSelector';
import validator from 'validator';

interface StytchOTPProps {
  method: OtpMethod;
  authWithStytch: any;
  setView: React.Dispatch<React.SetStateAction<string>>;
  theme: ThemeType;
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
const StytchOTP = ({ method, authWithStytch, theme }: StytchOTPProps) => {
  const [step, setStep] = useState<OtpStep>('submit');
  const [userId, setUserId] = useState<string>('');
  const [methodId, setMethodId] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [countryCode, setCountryCode] = useState<string>('+1');
  const [countryName, setCountryName] = useState<string>('United States');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const stytchClient = useStytch();

  // Reset navigation state when component mounts
  useEffect(() => {
    setIsNavigating(false);
  }, []);

  // Handle phone number changes and combine with country code
  const handlePhoneChange = (value: string) => {
    // Remove non-digit characters for validation
    const digitsOnly = value.replace(/\D/g, '');
    // ITU-T E.164 standard: max 15 digits excluding '+' prefix
    if (digitsOnly.length > 15) {
      return; // Don't update if exceeds limit
    }

    // If user pastes a full international number (not just typing), extract parts
    if (value.startsWith('+') && value.length >= 8) {
      // Only for pasted numbers, not typing
      // Find the longest matching country code to handle cases like +1 (US/Canada)
      const foundCountry = countryCodes
        .filter((country) => value.startsWith(country.code))
        .sort((a, b) => b.code.length - a.code.length)[0];

      if (foundCountry) {
        setCountryCode(foundCountry.code);
        setCountryName(foundCountry.name);
        const phoneOnly = value.slice(foundCountry.code.length);
        setPhoneNumber(phoneOnly);
        setUserId(value);
      } else {
        setPhoneNumber(value);
        setUserId(value);
      }
    } else {
      setPhoneNumber(value);
      // Strip formatting characters for userId (only keep digits)
      const digitsOnly = value.replace(/\D/g, '');
      setUserId(countryCode + digitsOnly);
    }
  };

  const isInputValid =
    method === 'email'
      ? validator.isEmail(userId)
      : phoneNumber.length >= 7 && phoneNumber.length <= 15; // 7-15 digits for phone number

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

      await authWithStytch(response.session_jwt, response.user_id, method, userId);
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
          <div className="flex justify-center">
            <form className="space-y-4 w-4/5" onSubmit={sendPasscode}>
              {method === 'email' ? (
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className={`text-sm font-medium block ${theme.text}`}
                    style={fonts.heading}
                  >
                    Email Address
                  </label>
                  <p className={`text-xs ${theme.textMuted} mb-2`} style={fonts.body}>
                    We'll send a 6-digit verification code to your email address.
                  </p>
                  <div className="relative">
                    <input
                      id="email"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      type="email"
                      name="email"
                      className={`w-full px-3 py-2 pr-16 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.cardBg} ${theme.cardBorder} ${theme.text}`}
                      style={fonts.body}
                      placeholder="your@email.com"
                      autoComplete="email"
                    />
                    <button
                      type="submit"
                      disabled={loading || !isInputValid}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 font-medium text-sm disabled:cursor-not-allowed transition-colors ${
                        isInputValid && !loading
                          ? 'text-orange-500 hover:text-orange-600'
                          : `${theme.textMuted} opacity-50`
                      }`}
                    >
                      {loading ? '...' : 'Submit'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className={`text-sm font-medium block ${theme.text}`}
                    style={fonts.heading}
                  >
                    Phone Number
                  </label>
                  <p className={`text-xs ${theme.textMuted} mb-2`} style={fonts.body}>
                    We'll send a 6-digit verification code to your phone via SMS.
                  </p>
                  <div className="flex gap-1">
                    <CountryCodeSelector
                      selectedCountryCode={countryCode}
                      selectedCountryName={countryName}
                      onCountryCodeChange={(newCountryCode, newCountryName) => {
                        setCountryCode(newCountryCode);
                        setCountryName(newCountryName || 'United States');
                        setUserId(newCountryCode + phoneNumber);
                      }}
                      theme={theme}
                      disabled={loading}
                    />

                    {/* Phone Number Input */}
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        name="phone"
                        value={phoneNumber}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className={`w-full px-3 py-2 pr-16 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme.cardBg} ${theme.cardBorder} ${theme.text}`}
                        style={fonts.body}
                        placeholder="(555) 000-0000"
                      />
                      <button
                        type="submit"
                        disabled={loading || !isInputValid}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 font-medium text-sm disabled:cursor-not-allowed transition-colors z-10 ${
                          isInputValid && !loading
                            ? 'text-orange-500 hover:text-orange-600'
                            : `${theme.textMuted} opacity-50`
                        }`}
                      >
                        {loading ? '...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                  <p className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                    You can also paste a full international number (e.g., +14155552671)
                  </p>
                </div>
              )}

              {error && !isNavigating && <StatusMessage message={error} type="error" />}
            </form>
          </div>
        </>
      )}

      {step === 'verify' && (
        <>
          <div className="flex justify-center">
            <form className="space-y-4 w-4/5" onSubmit={authenticate}>
              <div className="space-y-2">
                <label
                  htmlFor="code"
                  className={`text-sm font-medium block ${theme.text}`}
                  style={fonts.heading}
                >
                  Verification Code
                </label>
                <div className="relative">
                  <input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    name="code"
                    className={`w-full px-3 py-2 pr-16 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center tracking-widest text-lg ${theme.cardBg} ${theme.cardBorder} ${theme.text}`}
                    style={fonts.body}
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />
                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 font-medium text-sm disabled:cursor-not-allowed transition-colors ${
                      code.length === 6 && !loading
                        ? 'text-orange-500 hover:text-orange-600'
                        : `${theme.textMuted} opacity-50`
                    }`}
                  >
                    {loading ? '...' : 'Submit'}
                  </button>
                </div>
              </div>

              {error && !isNavigating && <StatusMessage message={error} type="error" />}

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => setStep('submit')}
                  className={`${theme.cardBg} ${theme.text} border ${theme.cardBorder} rounded-xl py-3 px-4 w-full font-medium text-sm ${theme.itemHoverBg} transition-all duration-200 hover:shadow-sm flex items-center justify-center gap-2`}
                  style={fonts.heading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
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
