import { Dispatch, SetStateAction, useEffect } from 'react';
import { theme as themeImport, fonts } from '../connect/ui/theme';
import { AuthView } from '../connect/Connect';
import { useFarcaster } from '@/hooks/shared/useFarcaster';
import LoadingLock from '@/components/shared/ui/LoadingLock';

interface AuthMethodsProps {
  setView: Dispatch<SetStateAction<AuthView>>;
  clearError?: () => void;
}

const AuthMethods = ({ setView, clearError }: AuthMethodsProps) => {
  const { isInFarcaster, isLoading } = useFarcaster();

  useEffect(() => {
    if (clearError) {
      clearError();
    }
  }, [clearError]);

  return (
    <div className="space-y-3">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2" style={fonts.heading}>
          Authentication Required
        </h2>
        <p className="text-xs text-gray-600 dark:text-white/60" style={fonts.body}>
          Please log in or sign up to continue.
        </p>
      </div>
      {isLoading ? (
        <LoadingLock />
      ) : (
        <div className="flex flex-col items-center space-y-3">
          {!isInFarcaster && (
            <div
              className={`w-full sm:w-3/4 md:w-3/4 lg:w-full py-3 px-4 flex items-center justify-between bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer`}
              onClick={() => setView('email')}
            >
              <div className="flex items-center">
                <div className={`w-5 h-5 mr-3 flex items-center justify-center`}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={themeImport.brandOrange}
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span
                  className={`text-sm font-medium text-gray-900 dark:text-white`}
                  style={fonts.heading}
                >
                  Email
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-600 dark:text-white/60`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          )}

          {!isInFarcaster && (
            <div
              className={`w-full sm:w-3/4 md:w-3/4 lg:w-full py-3 px-4 flex items-center justify-between bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer`}
              onClick={() => setView('phone')}
            >
              <div className="flex items-center">
                <div className={`w-5 h-5 mr-3 flex items-center justify-center`}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={themeImport.brandOrange}
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span
                  className={`text-sm font-medium text-gray-900 dark:text-white`}
                  style={fonts.heading}
                >
                  Phone
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-600 dark:text-white/60`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          )}

          <div
            className={`w-full sm:w-3/4 md:w-3/4 lg:w-full py-3 px-4 flex items-center justify-between bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer`}
            onClick={() => setView('wallet')}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 mr-3 flex items-center justify-center`}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={themeImport.brandOrange}
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <span
                className={`text-sm font-medium text-gray-900 dark:text-white`}
                style={fonts.heading}
              >
                Wallet
              </span>
            </div>
            <svg
              className={`w-4 h-4 text-gray-600 dark:text-white/60`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {isInFarcaster && (
            <div className="w-full sm:w-3/4 md:w-3/4 lg:w-full p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/30 rounded-lg">
              <p className="text-xs text-orange-800 dark:text-orange-200 text-center">
                Wallet authentication is the only method available in Mini Apps.
              </p>
            </div>
          )}

          {!isInFarcaster && (
            <div
              className={`w-full sm:w-3/4 md:w-3/4 lg:w-full py-3 px-4 flex items-center justify-between bg-white dark:bg-gray-950 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer`}
              onClick={() => setView('webauthn')}
            >
              <div className="flex items-center">
                <div className={`w-5 h-5 mr-3 flex items-center justify-center`}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={themeImport.brandOrange}
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                    />
                  </svg>
                </div>
                <span
                  className={`text-sm font-medium text-gray-900 dark:text-white`}
                  style={fonts.heading}
                >
                  Passkey
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-600 dark:text-white/60`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthMethods;
