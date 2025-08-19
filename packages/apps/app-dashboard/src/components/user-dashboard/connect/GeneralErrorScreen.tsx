import { Card, CardContent } from '@/components/shared/ui/card';
import { AlertTriangle, ArrowLeft, RefreshCw, Sun, Moon } from 'lucide-react';
import { theme } from './ui/theme';
import { InfoBanner } from './ui/InfoBanner';
import { ActionCard } from './ui/ActionCard';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/shared/ui/button';
import { toggleTheme } from '@/lib/theme';
import { useCanGoBack } from '@/hooks/user-dashboard/connect/useCanGoBack';
import { useTheme } from '@/hooks/useTheme';

type GeneralErrorScreenProps = {
  errorDetails: string;
};

export function GeneralErrorScreen({ errorDetails }: GeneralErrorScreenProps) {
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
      className={`max-w-md mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden relative z-10 origin-center`}
    >
      {/* Header */}
      <div className={`px-6 py-4 border-b ${theme.cardBorder}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <img
                src={isDark ? '/logo-white.svg' : '/logo.svg'}
                alt="Vincent"
                className="h-4 cursor-pointer hover:opacity-80 transition-opacity"
              />
              <span className={`text-sm font-medium ${theme.text} mt-0.5`}>Vincent Connect</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={`${theme.text} hover:bg-white/10`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8 space-y-6">
        {/* Status Banner */}
        <InfoBanner
          type="warning"
          title="An Error Occurred"
          message="Something went wrong. Please check the details below and try again."
        />

        {/* Error Details Card */}
        <Card className={`backdrop-blur-xl ${theme.cardBg} border ${theme.cardBorder}`}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className={`text-lg font-semibold ${theme.text}`}>Error Details</h2>
                  <p className={`text-sm ${theme.textMuted} mt-1`}>
                    The following error occurred while processing your request.
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${theme.cardBg} border ${theme.cardBorder}`}>
                <p className={`text-sm ${theme.textMuted} font-mono break-all`}>{errorDetails}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Options Card */}
        <Card className={`backdrop-blur-xl ${theme.cardBg} border ${theme.cardBorder}`}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h2 className={`text-lg font-semibold ${theme.text}`}>What would you like to do?</h2>

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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
