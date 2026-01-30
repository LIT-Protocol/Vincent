import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Policy, PolicyVersion } from '@/types/developer-dashboard/appTypes';
import { Badge } from '@/components/shared/ui/badge';
import { theme, fonts } from '@/lib/themeClasses';
import { PolicyVersionActionButtons } from '../wrappers/ui/PolicyVersionActionButtons';
import { AppDetail } from '@/components/developer-dashboard/ui/AppDetail';

interface PolicyVersionDetailsViewProps {
  policy: Policy;
  version: PolicyVersion;
  onOpenMutation: (mutationType: string) => void;
}

export function PolicyVersionDetailsView({
  policy,
  version,
  onOpenMutation,
}: PolicyVersionDetailsViewProps) {
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
      {/* Header Card */}
      <div
        className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className={`text-3xl font-bold ${theme.text}`} style={fonts.heading}>
                  Version {version.version}
                </h1>
                {version.version === policy.activeVersion && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: `${theme.brandOrange}1A`,
                      color: theme.brandOrange,
                      ...fonts.heading,
                    }}
                  >
                    Active
                  </span>
                )}
              </div>

              {version.keywords && version.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {version.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
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
            Manage this version
          </p>
        </div>
        <div className="p-6">
          <PolicyVersionActionButtons onOpenMutation={onOpenMutation} />
        </div>
      </div>

      {/* Version Changes Card */}
      {version.changes && (
        <div
          className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
        >
          <div className={`p-6 border-b ${theme.cardBorder}`}>
            <h3 className={`text-lg font-semibold ${theme.text} mb-1`} style={fonts.heading}>
              Version Changes
            </h3>
            <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
              What's new in this version
            </p>
          </div>
          <div className="p-6">
            <p className={`${theme.text} whitespace-pre-wrap`} style={fonts.body}>
              {version.changes}
            </p>
          </div>
        </div>
      )}

      {/* Version Details Card */}
      <div
        className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
      >
        <div className={`p-6 border-b ${theme.cardBorder}`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-1`} style={fonts.heading}>
            Version Details
          </h3>
          <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
            Package information
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4">
            <AppDetail label="Package Name">
              <span className={`${theme.text} text-sm font-mono`} style={fonts.body}>
                {version.packageName}
              </span>
            </AppDetail>

            <AppDetail label="Version">
              <span className={`${theme.text} text-sm font-mono`} style={fonts.body}>
                {version.version}
              </span>
            </AppDetail>

            {version.ipfsCid && (
              <AppDetail label="IPFS CID" isLast>
                <span className={`${theme.text} text-xs font-mono break-all`} style={fonts.body}>
                  {version.ipfsCid}
                </span>
              </AppDetail>
            )}
          </div>
        </div>
      </div>

      {/* Author Information Card */}
      {version.author && (
        <div
          className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
        >
          <div className={`p-6 border-b ${theme.cardBorder}`}>
            <h3 className={`text-lg font-semibold ${theme.text} mb-1`} style={fonts.heading}>
              Author Information
            </h3>
            <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
              Package author details
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <AppDetail label="Name">
                <span className={`${theme.text} text-sm`} style={fonts.body}>
                  {version.author.name}
                </span>
              </AppDetail>

              {version.author.email && (
                <AppDetail label="Email">
                  <a
                    href={`mailto:${version.author.email}`}
                    className="text-sm hover:underline"
                    style={{ color: theme.brandOrange, ...fonts.body }}
                  >
                    {version.author.email}
                  </a>
                </AppDetail>
              )}

              {version.author.url && (
                <AppDetail label="Website" isLast>
                  <a
                    href={version.author.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline inline-flex items-center gap-1"
                    style={{ color: theme.brandOrange, ...fonts.body }}
                  >
                    {version.author.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </AppDetail>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Repository & Homepage Cards (side by side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {version.repository && version.repository.length > 0 && (
          <div
            className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
          >
            <div className={`p-6 border-b ${theme.cardBorder}`}>
              <h3 className={`text-lg font-semibold ${theme.text} mb-1`} style={fonts.heading}>
                Repository
              </h3>
              <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
                Source code location
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {version.repository.map((repo, index) => (
                  <a
                    key={index}
                    href={repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline inline-flex items-center gap-1 break-all"
                    style={{ color: theme.brandOrange, ...fonts.body }}
                  >
                    {repo}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {version.homepage && (
          <div
            className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
          >
            <div className={`p-6 border-b ${theme.cardBorder}`}>
              <h3 className={`text-lg font-semibold ${theme.text} mb-1`} style={fonts.heading}>
                Homepage
              </h3>
              <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
                Project website
              </p>
            </div>
            <div className="p-6">
              <a
                href={version.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:underline inline-flex items-center gap-1 break-all"
                style={{ color: theme.brandOrange, ...fonts.body }}
              >
                {version.homepage}
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Dependencies Card */}
      {version.dependencies && version.dependencies.length > 0 && (
        <div
          className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
        >
          <div className={`p-6 border-b ${theme.cardBorder}`}>
            <h3 className={`text-lg font-semibold ${theme.text} mb-1`} style={fonts.heading}>
              Dependencies
            </h3>
            <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
              Required packages
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {version.dependencies.map((dep) => (
                <div
                  key={dep}
                  className={`text-sm ${theme.text} font-mono ${theme.itemBg} px-3 py-2 rounded border ${theme.cardBorder}`}
                  style={fonts.body}
                >
                  {dep}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contributors Card */}
      {version.contributors && version.contributors.length > 0 && (
        <div
          className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
        >
          <div className={`p-6 border-b ${theme.cardBorder}`}>
            <h3 className={`text-lg font-semibold ${theme.text} mb-1`} style={fonts.heading}>
              Contributors
            </h3>
            <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
              People who contributed to this version
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {version.contributors.map((contributor, index) => (
                <div
                  key={index}
                  className={`border ${theme.cardBorder} rounded-lg p-4 ${theme.itemBg}`}
                >
                  <div className={`font-medium ${theme.text}`} style={fonts.heading}>
                    {contributor.name}
                  </div>
                  {contributor.email && (
                    <div className="text-sm mt-1">
                      <a
                        href={`mailto:${contributor.email}`}
                        className="hover:underline"
                        style={{ color: theme.brandOrange, ...fonts.body }}
                      >
                        {contributor.email}
                      </a>
                    </div>
                  )}
                  {contributor.url && (
                    <div className="text-sm mt-1">
                      <a
                        href={contributor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline inline-flex items-center gap-1"
                        style={{ color: theme.brandOrange, ...fonts.body }}
                      >
                        {contributor.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
