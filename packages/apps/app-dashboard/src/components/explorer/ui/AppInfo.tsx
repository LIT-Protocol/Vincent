import { Button } from '@/components/shared/ui/button';
import {
  Hash,
  User,
  Mail,
  Shield,
  Copy,
  CheckCircle,
  Calendar,
  Clock,
  Zap,
  Globe,
} from 'lucide-react';
import { useState } from 'react';
import { App } from '@/types/developer-dashboard/appTypes';
import { useTheme } from '@/providers/ThemeProvider';
import { explorerTheme } from '@/utils/explorer/theme';

export function AppInfo({ app }: { app: App }) {
  const { isDark } = useTheme();
  const theme = explorerTheme(isDark);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Basic Information Card */}
      <div className="group relative">
        <div
          className={`absolute inset-0 ${theme.glowColor} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
        ></div>
        <div
          className={`relative ${theme.cardBg} backdrop-blur-xl border ${theme.cardBorder} rounded-2xl p-6 ${theme.cardHoverBorder} transition-all duration-500`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${theme.iconBg} border ${theme.iconBorder}`}>
              <Hash className={`w-5 h-5 ${theme.iconColor}`} />
            </div>
            <h2 className={`text-lg font-light ${theme.text} transition-colors duration-500`}>
              Basic Information
            </h2>
          </div>

          <div className="space-y-4">
            <div className="group/item">
              <div
                className={`flex items-center justify-between p-4 rounded-xl ${theme.itemBg} ${theme.itemHoverBg} border ${theme.itemBorder} ${theme.itemHoverBorder} transition-all duration-300`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-medium ${theme.textSubtle} mb-1`}>App ID</p>
                  <p
                    className={`text-sm ${isDark ? 'text-white/90' : 'text-black/90'} font-mono break-all`}
                  >
                    {app.appId}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(app.appId.toString(), 'appId')}
                  className={`${theme.textSubtle} hover:${theme.text} ml-2 opacity-0 group-hover/item:opacity-100 transition-all duration-300`}
                >
                  {copiedField === 'appId' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {app.activeVersion && (
              <div className={`p-4 rounded-xl ${theme.itemBg} border ${theme.itemBorder}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Zap className={`w-4 h-4 ${theme.iconColorMuted}`} />
                  <p className={`text-xs font-medium ${theme.textSubtle}`}>Active Version</p>
                </div>
                <p className={`text-2xl font-light ${isDark ? 'text-white/90' : 'text-black/90'}`}>
                  v{app.activeVersion}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div
                className={`p-4 rounded-xl ${theme.itemBg} border ${theme.itemBorder} ${theme.itemHoverBorder} transition-all duration-300`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className={`w-4 h-4 ${theme.iconColorMuted}`} />
                  <p className={`text-xs font-medium ${theme.textSubtle}`}>Created</p>
                </div>
                <p className={`text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {new Date(app.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div
                className={`p-4 rounded-xl ${theme.itemBg} border ${theme.itemBorder} ${theme.itemHoverBorder} transition-all duration-300`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Clock className={`w-4 h-4 ${theme.iconColorMuted}`} />
                  <p className={`text-xs font-medium ${theme.textSubtle}`}>Updated</p>
                </div>
                <p className={`text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {new Date(app.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Management Card */}
      <div className="group relative">
        <div
          className={`absolute inset-0 ${theme.glowColor} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
        ></div>
        <div
          className={`relative ${theme.cardBg} backdrop-blur-xl border ${theme.cardBorder} rounded-2xl p-6 ${theme.cardHoverBorder} transition-all duration-500`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${theme.iconBg} border ${theme.iconBorder}`}>
              <User className={`w-5 h-5 ${theme.iconColor}`} />
            </div>
            <h2 className={`text-lg font-light ${theme.text} transition-colors duration-500`}>
              Contact & Management
            </h2>
          </div>

          <div className="space-y-4">
            {app.contactEmail && (
              <div className="group/item">
                <div
                  className={`flex items-center justify-between p-4 rounded-xl ${theme.itemBg} ${theme.itemHoverBg} border ${theme.itemBorder} ${theme.itemHoverBorder} transition-all duration-300`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Mail className={`w-4 h-4 ${theme.iconColorMuted}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-medium ${theme.textSubtle} mb-1`}>
                        Contact Email
                      </p>
                      <p
                        className={`text-sm ${isDark ? 'text-white/90' : 'text-black/90'} break-all`}
                      >
                        {app.contactEmail}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(app.contactEmail || '', 'email')}
                    className={`${theme.textSubtle} hover:${theme.text} ml-2 opacity-0 group-hover/item:opacity-100 transition-all duration-300`}
                  >
                    {copiedField === 'email' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {app.managerAddress && (
              <div className="group/item">
                <div
                  className={`flex items-center justify-between p-4 rounded-xl ${theme.itemBg} ${theme.itemHoverBg} border ${theme.itemBorder} ${theme.itemHoverBorder} transition-all duration-300`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Shield className={`w-4 h-4 ${theme.iconColorMuted}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-medium ${theme.textSubtle} mb-1`}>
                        Manager Address
                      </p>
                      <p
                        className={`text-sm ${isDark ? 'text-white/90' : 'text-black/90'} font-mono break-all`}
                      >
                        <span className="sm:hidden">
                          {app.managerAddress.substring(0, 10)}...{app.managerAddress.slice(-8)}
                        </span>
                        <span className="hidden sm:inline">{app.managerAddress}</span>
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(app.managerAddress || '', 'manager')}
                    className={`${theme.textSubtle} hover:${theme.text} ml-2 opacity-0 group-hover/item:opacity-100 transition-all duration-300`}
                  >
                    {copiedField === 'manager' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {app.appUserUrl && (
              <div
                className={`p-4 rounded-xl ${theme.itemBg} border ${theme.itemBorder} ${theme.itemHoverBorder} transition-all duration-300`}
              >
                <div className="flex items-center gap-3">
                  <Globe className={`w-4 h-4 ${theme.iconColorMuted}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium ${theme.textSubtle} mb-1`}>App URL</p>
                    <a
                      href={app.appUserUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm ${isDark ? 'text-white/70 hover:text-white' : 'text-black/70 hover:text-black'} underline break-all transition-colors duration-300`}
                    >
                      {app.appUserUrl}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
