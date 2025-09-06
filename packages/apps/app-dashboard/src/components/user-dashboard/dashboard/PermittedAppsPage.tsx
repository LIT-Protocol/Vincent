import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@/types/developer-dashboard/appTypes';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Logo } from '@/components/shared/ui/Logo';
import { Package, Info, Copy, Check, Wallet } from 'lucide-react';
import { AgentAppPermission } from '@/utils/user-dashboard/getAgentPkps';

type PermittedAppsPageProps = {
  apps: App[];
  permittedPKPs: AgentAppPermission[];
};

export function PermittedAppsPage({ apps, permittedPKPs }: PermittedAppsPageProps) {
  const navigate = useNavigate();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const handleAppClick = (appId: string) => {
    navigate(`/user/appId/${appId}`);
  };

  const handleWalletClick = (appId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/user/appId/${appId}/wallet`);
  };

  const handleCopyAddress = async (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const toggleTooltip = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveTooltip(activeTooltip === address ? null : address);
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 7)}...${address.slice(-5)}`;
  };

  if (apps.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="text-center max-w-md mx-auto px-6">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${theme.itemBg} ${theme.cardBorder} border mb-6`}
          >
            <Package className={`w-8 h-8 ${theme.textMuted}`} />
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${theme.text}`}>No applications found</h3>
          <p className={`text-sm ${theme.textMuted} leading-relaxed`}>
            You haven't granted permissions to any applications yet. Once you authorize apps,
            they'll appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-start px-3 sm:px-6 pt-6">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <Card
            key={app.appId}
            className={`py-0 gap-0 backdrop-blur-xl ${theme.mainCard} border ${theme.cardBorder} ${theme.cardHoverBorder} cursor-pointer transition-all duration-200 hover:shadow-lg`}
            onClick={() => handleAppClick(app.appId.toString())}
            style={{ height: '160px' }}
          >
            <CardContent className="p-3 relative">
              {/* Top right badges container */}
              <div className="absolute top-2 right-2 flex items-center gap-2">
                {/* Wallet Icon */}
                <Wallet
                  className={`w-4 h-4 ${theme.textMuted} hover:${theme.text} transition-colors cursor-pointer`}
                  onClick={(e) => handleWalletClick(app.appId.toString(), e)}
                />

                {/* Agent PKP Info Icon */}
                {(() => {
                  const permission = permittedPKPs.find((p) => p.appId === app.appId);
                  return (
                    permission && (
                      <div className="relative">
                        <Info
                          className={`w-4 h-4 ${theme.textMuted} hover:${theme.text} transition-colors cursor-pointer`}
                          onClick={(e) => toggleTooltip(permission.pkp.ethAddress, e)}
                        />
                        {/* Tooltip */}
                        {activeTooltip === permission.pkp.ethAddress && (
                          <div className="absolute bottom-full right-0 mb-2 !bg-white border border-gray-200 !text-black shadow-lg text-xs rounded-lg pointer-events-auto z-10 w-40">
                            <div className="p-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-gray-600 text-[10px] mb-1">
                                    Agent Address:
                                  </div>
                                  <div className="font-mono text-xs text-black">
                                    {truncateAddress(permission.pkp.ethAddress)}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => handleCopyAddress(permission.pkp.ethAddress, e)}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                                  title="Copy address"
                                >
                                  {copiedAddress === permission.pkp.ethAddress ? (
                                    <Check className="w-3 h-3 text-green-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                          </div>
                        )}
                      </div>
                    )
                  );
                })()}

                {/* Version Badge */}
                {app.activeVersion && (
                  <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                    v{app.activeVersion}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {/* Logo and Title Row */}
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Logo
                      logo={app.logo}
                      alt={`${app.name} logo`}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold ${theme.text} truncate`}>{app.name}</h3>
                  </div>
                </div>

                {/* Description */}
                {app.description && (
                  <p className={`text-sm ${theme.textMuted} line-clamp-3`}>{app.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
