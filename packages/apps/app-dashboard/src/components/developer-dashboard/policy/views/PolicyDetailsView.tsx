import { useState, useEffect } from 'react';
import { Policy, PolicyVersion } from '@/types/developer-dashboard/appTypes';
import { Badge } from '@/components/shared/ui/badge';
import { Logo } from '@/components/shared/ui/Logo';
import { theme, fonts } from '@/lib/themeClasses';
import { motion } from 'framer-motion';
import { AppDetail } from '@/components/developer-dashboard/ui/AppDetail';
import { PolicyActionButtons } from '../wrappers/ui/PolicyActionButtons';

interface PolicyOverviewProps {
  policy: Policy;
  activeVersionData: PolicyVersion;
  onOpenMutation: (mutationType: string) => void;
}

export default function PolicyOverview({
  policy,
  activeVersionData,
  onOpenMutation,
}: PolicyOverviewProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setShowContent(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: showContent ? 1 : 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="w-full space-y-6 relative z-10"
    >
      {/* Header Card with Policy Info */}
      <div
        className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className={`text-3xl font-bold ${theme.text}`} style={fonts.heading}>
                  {policy.title || policy.packageName}
                </h1>
              </div>

              {/* Package Name with NPM Link */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-sm ${theme.textMuted}`} style={fonts.body}>
                  Package:
                </span>
                <code
                  className={`text-sm font-mono ${theme.itemBg} px-2 py-1 rounded ${theme.text}`}
                  style={fonts.body}
                >
                  {policy.packageName}
                </code>
                <a
                  href={`https://www.npmjs.com/package/${policy.packageName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded transition-opacity hover:opacity-80`}
                  title="View on NPM"
                >
                  <img src="/npm.png" alt="NPM" className="h-6 w-6 object-contain" />
                </a>
              </div>

              <p className={`${theme.textMuted} leading-relaxed mb-3`} style={fonts.body}>
                {activeVersionData.description || policy.description}
              </p>

              {activeVersionData?.keywords && activeVersionData.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeVersionData.keywords.map((keyword: string) => (
                    <Badge key={keyword} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Logo */}
            <div className="flex-shrink-0">
              {policy.logo && policy.logo.length >= 10 ? (
                <Logo
                  logo={policy.logo}
                  alt="Policy logo"
                  className={`w-24 h-24 object-contain rounded-lg border ${theme.mainCardBorder} shadow-sm`}
                />
              ) : (
                <div
                  className={`w-24 h-24 rounded-lg border ${theme.mainCardBorder} flex items-center justify-center ${theme.itemBg}`}
                >
                  <img src="/logo.svg" alt="Vincent logo" className="w-12 h-12 opacity-50" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions Card */}
      <div
        className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
      >
        <div className={`p-6 border-b ${theme.cardBorder}`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-1`} style={fonts.heading}>
            Actions
          </h3>
          <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
            Manage your policy
          </p>
        </div>
        <div className="p-6">
          <PolicyActionButtons onOpenMutation={onOpenMutation} />
        </div>
      </div>

      {/* Policy Information Card */}
      <div
        className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
      >
        <div className={`p-6 border-b ${theme.cardBorder}`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-1`} style={fonts.heading}>
            Policy Information
          </h3>
          <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
            Package details
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4">
            <AppDetail label="Package Name">
              <span className={`${theme.text} text-sm font-mono`} style={fonts.body}>
                {policy.packageName}
              </span>
            </AppDetail>

            <AppDetail label="Active Version">
              <span className={`${theme.text} text-sm`} style={fonts.body}>
                {policy.activeVersion || 'N/A'}
              </span>
            </AppDetail>

            {activeVersionData.author && (
              <AppDetail label="Author">
                <div className="space-y-1">
                  <span className={`${theme.text} text-sm`} style={fonts.body}>
                    {activeVersionData.author.name}
                  </span>
                  {activeVersionData.author.email && (
                    <div className={`text-xs ${theme.textMuted}`} style={fonts.body}>
                      {activeVersionData.author.email}
                    </div>
                  )}
                  {activeVersionData.author.url && (
                    <div className="text-xs">
                      <a
                        href={activeVersionData.author.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                        style={{ color: theme.brandOrange, ...fonts.body }}
                      >
                        {activeVersionData.author.url}
                      </a>
                    </div>
                  )}
                </div>
              </AppDetail>
            )}

            {activeVersionData?.homepage && (
              <AppDetail label="Homepage">
                <a
                  href={activeVersionData.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                  style={{ color: theme.brandOrange, ...fonts.body }}
                >
                  {activeVersionData.homepage}
                </a>
              </AppDetail>
            )}

            {activeVersionData?.repository && activeVersionData.repository.length > 0 && (
              <AppDetail label="Repository">
                <div className="space-y-1">
                  {activeVersionData.repository.map((repo: string, index: number) => (
                    <div key={index}>
                      <a
                        href={repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline"
                        style={{ color: theme.brandOrange, ...fonts.body }}
                      >
                        {repo}
                      </a>
                    </div>
                  ))}
                </div>
              </AppDetail>
            )}

            {activeVersionData.ipfsCid && (
              <AppDetail label="IPFS CID">
                <span className={`${theme.text} text-sm font-mono break-all`} style={fonts.body}>
                  {activeVersionData.ipfsCid}
                </span>
              </AppDetail>
            )}

            {policy.deploymentStatus && (
              <AppDetail label="Deployment Status">
                <span
                  className={`inline-block px-2 py-1 rounded text-sm font-semibold ${
                    policy.deploymentStatus === 'prod'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                      : policy.deploymentStatus === 'test'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                        : `${theme.itemBg} ${theme.textMuted}`
                  }`}
                  style={fonts.heading}
                >
                  {policy.deploymentStatus.toUpperCase()}
                </span>
              </AppDetail>
            )}

            {policy.createdAt && (
              <AppDetail label="Created At">
                <span className={`${theme.text} text-sm`} style={fonts.body}>
                  {new Date(policy.createdAt).toLocaleString()}
                </span>
              </AppDetail>
            )}

            {policy.updatedAt && (
              <AppDetail label="Updated At" isLast>
                <span className={`${theme.text} text-sm`} style={fonts.body}>
                  {new Date(policy.updatedAt).toLocaleString()}
                </span>
              </AppDetail>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
