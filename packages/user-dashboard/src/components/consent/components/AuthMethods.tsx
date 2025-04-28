import { Dispatch, SetStateAction } from 'react';

interface AuthMethodsProps {
  setView: Dispatch<SetStateAction<string>>;
}

const AuthMethods = ({
  setView,
}: AuthMethodsProps) => {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-gray-700 mb-2">Select an authentication method:</h2>

      <div
        className="w-full py-3 px-4 flex items-center justify-between bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => setView('email')}
      >
        <div className="flex items-center">
          <div className="w-5 h-5 text-gray-500 mr-3 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-gray-700 text-sm font-medium">Continue with email</span>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <div
        className="w-full py-3 px-4 flex items-center justify-between bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => setView('phone')}
      >
        <div className="flex items-center">
          <div className="w-5 h-5 text-gray-500 mr-3 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-gray-700 text-sm font-medium">Continue with phone</span>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <div
        className="w-full py-3 px-4 flex items-center justify-between bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => setView('webauthn')}
      >
        <div className="flex items-center">
          <div className="w-5 h-5 text-gray-500 mr-3 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <span className="text-gray-700 text-sm font-medium">Use a passkey</span>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

export default AuthMethods;
