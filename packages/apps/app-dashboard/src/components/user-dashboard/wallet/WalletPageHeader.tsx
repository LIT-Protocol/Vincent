import { Logo } from '@/components/shared/ui/Logo';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';
import { CopyButton } from '@/components/shared/ui/CopyButton';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import { useNavigate } from 'react-router-dom';

interface WalletPageHeaderProps {
  appId: string;
  appName?: string;
  appLogo?: string;
  appDescription?: string;
  walletAddress: string;
}

export function WalletPageHeader({
  appId,
  appName,
  appLogo,
  appDescription,
  walletAddress,
}: WalletPageHeaderProps) {
  const navigate = useNavigate();

  return (
    <>
      <Breadcrumb
        items={[
          { label: appName || `App ${appId}`, onClick: () => navigate(`/user/appId/${appId}`) },
          { label: 'Wallet' },
        ]}
      />

      {/* Main Header Card */}
      <div
        className={`backdrop-blur-xl ${theme.mainCard} border ${theme.mainCardBorder} rounded-lg p-3 sm:p-4 lg:p-6`}
      >
        {/* Top Section: App Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Logo
              logo={appLogo}
              alt={appName || 'App'}
              className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-lg object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1 overflow-hidden">
              <h1
                className={`text-2xl sm:text-2xl lg:text-3xl font-bold ${theme.text}`}
                style={fonts.heading}
              >
                {appName || `App ${appId}`} Wallet
              </h1>
              {appDescription && (
                <p
                  className={`text-sm sm:text-base ${theme.textMuted} mt-0.5 sm:mt-1`}
                  style={{
                    ...fonts.body,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-word',
                  }}
                >
                  {appDescription}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Address Card */}
      <div
        className={`backdrop-blur-xl ${theme.mainCard} border ${theme.cardBorder} rounded-lg p-2.5 sm:p-3 lg:p-4`}
      >
        <div className="space-y-2">
          <p className={`text-sm sm:text-base font-medium ${theme.text}`} style={fonts.heading}>
            Wallet Address
          </p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <p className={`text-xs font-mono ${theme.text} break-all leading-relaxed`}>
                {walletAddress}
              </p>
            </div>
            <CopyButton textToCopy={walletAddress} iconSize="w-3.5 h-3.5" orangeIcon />
          </div>
        </div>
      </div>
    </>
  );
}
