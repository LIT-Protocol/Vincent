import { ArrowLeft, RefreshCw } from 'lucide-react';
import { theme, fonts } from './ui/theme';
import { InfoBanner } from './ui/InfoBanner';
import { ActionCard } from './ui/ActionCard';
import { useNavigate } from 'react-router-dom';
import { useCanGoBack } from '@/hooks/user-dashboard/connect/useCanGoBack';
import { ConnectPageHeader } from './ui/ConnectPageHeader';

type GeneralErrorScreenProps = {
  errorDetails: string;
};

export function GeneralErrorScreen({ errorDetails }: GeneralErrorScreenProps) {
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
      <ConnectPageHeader />

      {/* Main Content */}
      <div className="px-3 sm:px-4 py-6 sm:py-8 space-y-6">
        {/* Status Banner */}
        <InfoBanner
          type="red"
          title="An Error Occurred"
          message="Something went wrong. Please check the details below."
        />

        {/* Error Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className={`text-sm font-semibold ${theme.text}`} style={fonts.heading}>
              Error Details
            </h2>
          </div>

          <div className={`p-3 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}>
            <p className={`text-xs ${theme.textMuted} font-mono break-all`}>{errorDetails}</p>
          </div>
        </div>

        {/* Dividing line */}
        <div className={`border-b ${theme.cardBorder}`}></div>

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
