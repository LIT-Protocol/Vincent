import { Mail, Copy, CheckCircle, ChevronDown, ChevronUp, Hash, Zap, Globe } from 'lucide-react';
import { useState } from 'react';
import { App } from '@/types/developer-dashboard/appTypes';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

export function AppInfo({ app }: { app: App }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showTechnicalInfo, setShowTechnicalInfo] = useState(false);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    /* Contact & Management Card */
    <div className="group relative">
      <div
        className={`relative bg-white dark:bg-gray-950 border ${theme.cardBorder} rounded-xl md:rounded-2xl p-4 sm:p-6 ${theme.cardHoverBorder} transition-all duration-500`}
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <h2 className={`text-base sm:text-lg font-semibold ${theme.text}`} style={fonts.heading}>
            Contact & Management
          </h2>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {app.contactEmail && (
            <div className="group/item">
              <div
                className={`flex items-center justify-between p-4 rounded-xl ${theme.itemBg} border ${theme.cardBorder} ${theme.itemHoverBg} transition-all duration-300`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Mail className={`w-4 h-4 ${theme.textMuted}`} />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-medium ${theme.textMuted} mb-1`}
                      style={fonts.heading}
                    >
                      Contact Email
                    </p>
                    <p className={`text-sm ${theme.text} break-all`} style={fonts.body}>
                      {app.contactEmail}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(app.contactEmail || '', 'email')}
                  className={`${theme.textMuted} hover:${theme.text} ml-2 opacity-0 group-hover/item:opacity-100 transition-all duration-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800`}
                >
                  {copiedField === 'email' ? (
                    <CheckCircle className="w-4 h-4" style={{ color: theme.brandOrange }} />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {app.appUserUrl && (
            <div
              className={`p-4 rounded-xl ${theme.itemBg} border ${theme.cardBorder} ${theme.itemHoverBg} transition-all duration-300`}
            >
              <div className="flex items-center gap-3">
                <Globe className={`w-4 h-4 ${theme.textMuted}`} />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-medium ${theme.textMuted} mb-1`}
                    style={fonts.heading}
                  >
                    App URL
                  </p>
                  <a
                    href={app.appUserUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline break-all transition-colors duration-300 hover:opacity-80"
                    style={{ ...fonts.body, color: theme.brandOrange }}
                  >
                    {app.appUserUrl}
                  </a>
                </div>
              </div>
            </div>
          )}

          {!app.contactEmail && !app.appUserUrl && (
            <div
              className={`p-8 rounded-xl ${theme.itemBg} border ${theme.cardBorder} text-center`}
            >
              <p className={`${theme.textMuted} text-sm`} style={fonts.body}>
                No contact information available
              </p>
            </div>
          )}

          {/* Expandable Technical Details - Inside Contact Card */}
          <div className={`pt-3 sm:pt-4 border-t ${theme.cardBorder}`}>
            <button
              onClick={() => setShowTechnicalInfo(!showTechnicalInfo)}
              className={`w-full flex items-center justify-between p-3 rounded-lg ${theme.itemBg} ${theme.itemHoverBg} transition-all duration-300`}
            >
              <div className="flex items-center gap-2">
                <Hash className={`w-3 h-3 sm:w-4 sm:h-4 ${theme.textMuted}`} />
                <span
                  className={`text-xs sm:text-sm font-medium ${theme.textMuted}`}
                  style={fonts.heading}
                >
                  Technical Details
                </span>
              </div>
              {showTechnicalInfo ? (
                <ChevronUp className={`w-3 h-3 sm:w-4 sm:h-4 ${theme.textMuted}`} />
              ) : (
                <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 ${theme.textMuted}`} />
              )}
            </button>

            {showTechnicalInfo && (
              <div className="mt-3 space-y-3 animate-fadeIn">
                {/* App ID */}
                <div className="group/item">
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg ${theme.itemBg} border ${theme.cardBorder} ${theme.itemHoverBg} transition-all duration-300`}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-medium ${theme.textMuted} mb-1`}
                        style={fonts.heading}
                      >
                        App ID
                      </p>
                      <p className={`text-sm ${theme.text} break-all`} style={fonts.body}>
                        {app.appId}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(app.appId.toString(), 'appId')}
                      className={`${theme.textMuted} hover:${theme.text} ml-2 opacity-0 group-hover/item:opacity-100 transition-all duration-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800`}
                    >
                      {copiedField === 'appId' ? (
                        <CheckCircle className="w-4 h-4" style={{ color: theme.brandOrange }} />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Active Version */}
                {app.activeVersion && (
                  <div className={`p-3 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className={`w-3 h-3 ${theme.textMuted}`} />
                      <p className={`text-xs font-medium ${theme.textMuted}`} style={fonts.heading}>
                        Active Version
                      </p>
                    </div>
                    <p className={`text-sm ${theme.text}`} style={fonts.body}>
                      v{app.activeVersion}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
