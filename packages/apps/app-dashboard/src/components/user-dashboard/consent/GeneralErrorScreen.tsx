import { Card, CardContent } from '@/components/shared/ui/card';
import { AlertTriangle, ArrowLeft, RefreshCw, Sun, Moon } from 'lucide-react';
import { theme } from './ui/theme';
import { InfoBanner } from './ui/InfoBanner';
import { ActionCard } from './ui/ActionCard';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/shared/ui/button';
import { useTheme } from '@/providers/ThemeProvider';

type GeneralErrorScreenProps = {
  errorDetails: string;
};

export function GeneralErrorScreen({ errorDetails }: GeneralErrorScreenProps) {
  const { isDark, toggleTheme } = useTheme();
  const themeStyles = theme(isDark);
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRetry = () => {
    // Force a page refresh to retry
    window.location.reload();
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${themeStyles.bg} p-4`}>
      {/* Main Card Container */}
      <div
        className={`max-w-6xl mx-auto ${themeStyles.mainCard} border ${themeStyles.mainCardBorder} rounded-2xl shadow-2xl overflow-hidden`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${themeStyles.cardBorder}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center">
                <img
                  src={isDark ? '/vincent-by-lit-white-logo.png' : '/vincent-by-lit-logo.png'}
                  alt="Vincent by Lit Protocol"
                  className="h-8 cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className={`${themeStyles.text} hover:bg-white/10`}
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
            theme={themeStyles}
            type="warning"
            title="Something went wrong"
            message="We encountered an error while loading the consent information. Please try again or go back to continue."
          />

          {/* Info Card */}
          <Card
            className={`backdrop-blur-xl ${themeStyles.cardBg} border ${themeStyles.cardBorder}`}
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold ${themeStyles.text}`}>
                      Error Loading Consent
                    </h2>
                    <p className={`text-sm ${themeStyles.textMuted} mt-1`}>
                      We're unable to load the consent information at this time.
                    </p>
                  </div>
                </div>

                {errorDetails && (
                  <div
                    className={`p-4 rounded-lg ${themeStyles.cardBg} border ${themeStyles.cardBorder}`}
                  >
                    <h3 className={`text-sm font-medium ${themeStyles.text} mb-2`}>
                      Error Details
                    </h3>
                    <p className={`text-sm ${themeStyles.textMuted} font-mono`}>{errorDetails}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Options Card */}
          <Card
            className={`backdrop-blur-xl ${themeStyles.cardBg} border ${themeStyles.cardBorder}`}
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                <h2 className={`text-lg font-semibold ${themeStyles.text}`}>
                  What would you like to do?
                </h2>

                <div className="space-y-3">
                  {/* Go Back Option */}
                  <ActionCard
                    theme={themeStyles}
                    icon={<ArrowLeft className="w-4 h-4 text-blue-500" />}
                    iconBg="bg-blue-500/20"
                    title="Go Back"
                    description="Return to the previous page"
                    onClick={handleGoBack}
                  />

                  {/* Retry Option */}
                  <ActionCard
                    theme={themeStyles}
                    icon={<RefreshCw className="w-4 h-4 text-green-500" />}
                    iconBg="bg-green-500/20"
                    title="Try Again"
                    description="Refresh the page and try again"
                    onClick={handleRetry}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
