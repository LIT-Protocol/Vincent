import { ShieldAlert, Home, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

type ResourceNotOwnedErrorProps = {
  resourceType: 'app' | 'ability' | 'policy';
  resourceName?: string;
  resourceId?: string;
  errorDetails?: string;
};

export function ResourceNotOwnedError({ resourceType, errorDetails }: ResourceNotOwnedErrorProps) {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    navigate('/developer/dashboard');
  };

  const handleContactSupport = () => {
    window.open('https://t.me/+aa73FAF9Vp82ZjJh', '_blank');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12">
      <div
        className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
      >
        {/* Header Section */}
        <div className="p-8 text-center border-b border-gray-200 dark:border-white/10">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4`}
            style={{ backgroundColor: '#FEF2F2' }}
          >
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${theme.text}`} style={fonts.heading}>
            Access Denied
          </h1>
          <p className={`text-base ${theme.textMuted}`} style={fonts.body}>
            You don't have permission to access this {resourceType}
          </p>
        </div>

        {/* Details Section */}
        <div className="p-8 space-y-6">
          {errorDetails && (
            <div className={`p-4 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}>
              <p className={`text-sm ${theme.textMuted} font-mono`} style={fonts.body}>
                {errorDetails}
              </p>
            </div>
          )}

          <div>
            <h3 className={`text-sm font-semibold ${theme.text} mb-3`} style={fonts.heading}>
              Why am I seeing this?
            </h3>
            <ul className={`space-y-2 text-sm ${theme.textMuted}`} style={fonts.body}>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>This {resourceType} belongs to another user</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>The {resourceType} ID may be incorrect</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="pt-4 space-y-3">
            <button
              onClick={handleGoToDashboard}
              className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg text-white font-semibold transition-colors`}
              style={{ backgroundColor: theme.brandOrange, ...fonts.heading }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.brandOrange;
              }}
            >
              <Home className="w-4 h-4" />
              Return to Dashboard
            </button>

            <button
              onClick={handleContactSupport}
              className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg border ${theme.mainCardBorder} ${theme.text} font-semibold transition-colors hover:bg-gray-50 dark:hover:bg-white/5`}
              style={fonts.heading}
            >
              <MessageCircle className="w-4 h-4" />
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
