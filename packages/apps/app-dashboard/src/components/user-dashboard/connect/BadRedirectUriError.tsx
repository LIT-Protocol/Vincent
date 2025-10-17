import { Card, CardContent } from '@/components/shared/ui/card';
import { AlertTriangle, ArrowLeft, RefreshCw, Sun, Moon } from 'lucide-react';
import { theme, fonts } from './ui/theme';
import { ActionCard } from './ui/ActionCard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared/ui/button';
import { toggleTheme } from '@/lib/theme';
import { useTheme } from '@/hooks/useTheme';
import { useCanGoBack } from '@/hooks/user-dashboard/connect/useCanGoBack';

type BadRedirectUriErrorProps = {
  redirectUri?: string;
  authorizedUris?: string[];
};

export function BadRedirectUriError({ redirectUri, authorizedUris }: BadRedirectUriErrorProps) {
  const isDark = useTheme();
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRetry = () => {
    // Force a page refresh to retry
    window.location.reload();
  };

  return (
    <div
      className={`w-full max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden relative z-10 origin-center`}
    >
      {/* Header */}
      <div className={`px-3 sm:px-6 py-3 border-b ${theme.cardBorder}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <img
              src={isDark ? '/logo-white.svg' : '/logo.svg'}
              alt="Vincent by Lit Protocol"
              className="h-4 w-4 flex-shrink-0"
            />
            <span
              className={`text-sm font-medium ${theme.text} truncate mt-0.5`}
              style={fonts.heading}
            >
              Vincent Connect
            </span>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={`${theme.text} hover:bg-white/10 px-2 sm:px-3`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        {/* Error Details Card */}
        <Card className={`${theme.itemBg} border ${theme.cardBorder}`}>
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <h2 className={`text-sm font-semibold ${theme.text}`} style={fonts.heading}>
                  Redirect URI Not Authorized
                </h2>
                <p className={`text-xs ${theme.textMuted} mt-0.5`} style={fonts.body}>
                  The redirect URI is not authorized for this app.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redirect URI Info */}
        {redirectUri && (
          <div className={`p-4 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}>
            <h3 className={`text-xs font-medium ${theme.text} mb-2`} style={fonts.heading}>
              Requested Redirect URI
            </h3>
            <p className={`text-xs ${theme.textMuted} font-mono break-all`}>{redirectUri}</p>
          </div>
        )}

        {/* Authorized URIs */}
        {authorizedUris && authorizedUris.length > 0 && (
          <div className={`p-4 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}>
            <h3 className={`text-xs font-medium ${theme.text} mb-2`} style={fonts.heading}>
              Authorized Redirect URIs
            </h3>
            <div className="space-y-1">
              {authorizedUris.map((uri, index) => (
                <p key={index} className={`text-xs ${theme.textMuted} font-mono break-all`}>
                  {uri}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Options */}
        <div className="space-y-3">
          {/* Go Back Option */}
          <ActionCard
            icon={<ArrowLeft className="w-4 h-4 text-gray-500" />}
            iconBg="bg-gray-500/20"
            title="Go Back"
            description=""
            onClick={handleGoBack}
            disabled={!canGoBack}
          />

          {/* Retry Option */}
          <ActionCard
            icon={<RefreshCw className="w-4 h-4 text-orange-500" />}
            iconBg="bg-orange-500/20"
            title="Try Again"
            description=""
            onClick={handleRetry}
          />
        </div>
      </div>
    </div>
  );
}
