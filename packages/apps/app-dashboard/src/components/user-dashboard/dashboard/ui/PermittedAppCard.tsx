import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@/types/developer-dashboard/appTypes';
import { theme } from '@/components/user-dashboard/connect/ui/theme';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Logo } from '@/components/shared/ui/Logo';
import { Copy, Check, Wallet, Settings } from 'lucide-react';
import { AgentAppPermission } from '@/utils/user-dashboard/getAgentPkps';

type PermittedAppCardProps = {
  app: App;
  permission: AgentAppPermission | undefined;
};

export function PermittedAppCard({ app, permission }: PermittedAppCardProps) {
  const navigate = useNavigate();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleManageClick = () => {
    navigate(`/user/appId/${app.appId}`);
  };

  const handleWalletClick = () => {
    navigate(`/user/appId/${app.appId}/wallet`);
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card
      className={`py-0 gap-0 backdrop-blur-xl ${theme.mainCard} border ${theme.cardBorder} ${theme.cardHoverBorder} transition-all duration-200 hover:shadow-lg w-full max-w-sm`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Logo and Title Row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Logo
                logo={app.logo}
                alt={`${app.name} logo`}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <h3 className={`font-semibold ${theme.text}`}>{app.name}</h3>
                {permission?.permittedVersion && (
                  <span className={`text-xs ${theme.textMuted}`}>
                    v{permission.permittedVersion}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Vincent Wallet Address */}
          {permission && (
            <div
              className={`flex items-center justify-between p-2 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}
            >
              <div className="flex flex-col">
                <span className={`text-xs ${theme.textMuted} mb-1`}>Vincent Wallet</span>
                <span className={`font-mono text-sm ${theme.text}`}>
                  {truncateAddress(permission.pkp.ethAddress)}
                </span>
              </div>
              <button
                onClick={() => handleCopyAddress(permission.pkp.ethAddress)}
                className={`p-1.5 hover:${theme.itemBg} rounded transition-colors`}
                title="Copy address"
              >
                {copiedAddress === permission.pkp.ethAddress ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className={`w-4 h-4 ${theme.textMuted}`} />
                )}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleWalletClick}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors`}
            >
              <Wallet className="w-4 h-4" />
              <span>Access Wallet</span>
            </button>
            <button
              onClick={handleManageClick}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${theme.cardBorder} ${theme.cardBg} hover:${theme.itemBg} ${theme.text} text-sm font-medium transition-colors`}
            >
              <Settings className="w-4 h-4" />
              <span>Manage Permissions</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
