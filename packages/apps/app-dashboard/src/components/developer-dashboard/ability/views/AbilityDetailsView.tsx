import { useState, useEffect } from 'react';
import { Ability, AbilityVersion } from '@/types/developer-dashboard/appTypes';
import { Badge } from '@/components/shared/ui/badge';
import { Logo } from '@/components/shared/ui/Logo';
import { theme, fonts } from '@/lib/themeClasses';
import { motion } from 'framer-motion';
import { AppDetail } from '@/components/developer-dashboard/ui/AppDetail';
import { AbilityActionButtons } from '../wrappers/ui/AbilityActionButtons';

interface AbilityOverviewProps {
  ability: Ability;
  activeVersionData: AbilityVersion;
  onOpenMutation: (mutationType: string) => void;
}

export default function AbilityOverview({
  ability,
  activeVersionData,
  onOpenMutation,
}: AbilityOverviewProps) {
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
      {/* Header Card with Ability Info */}
      <div
        className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className={`text-3xl font-bold ${theme.text}`} style={fonts.heading}>
                  {ability.title}
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
                  {ability.packageName}
                </code>
                <a
                  href={`https://www.npmjs.com/package/${ability.packageName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded transition-opacity hover:opacity-80`}
                  title="View on NPM"
                >
                  <img src="/npm.png" alt="NPM" className="h-6 w-6 object-contain" />
                </a>
              </div>

              <p className={`${theme.textMuted} leading-relaxed mb-3`} style={fonts.body}>
                {activeVersionData.description || ability.description}
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
              {ability.logo && ability.logo.length >= 10 ? (
                <Logo
                  logo={ability.logo}
                  alt="Ability logo"
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
            Manage your ability
          </p>
        </div>
        <div className="p-6">
          <AbilityActionButtons onOpenMutation={onOpenMutation} />
        </div>
      </div>

      {/* Ability Information Card */}
      <div
        className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
      >
        <div className={`p-6 border-b ${theme.cardBorder}`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-1`} style={fonts.heading}>
            Ability Information
          </h3>
          <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
            Package details
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4">
            <AppDetail label="Package Name">
              <span className={`${theme.text} text-sm font-mono`} style={fonts.body}>
                {ability.packageName}
              </span>
            </AppDetail>

            <AppDetail label="Active Version">
              <span className={`${theme.text} text-sm`} style={fonts.body}>
                {ability.activeVersion || 'N/A'}
              </span>
            </AppDetail>

            {activeVersionData.ipfsCid && (
              <AppDetail label="IPFS CID">
                <span className={`${theme.text} text-sm font-mono break-all`} style={fonts.body}>
                  {activeVersionData.ipfsCid}
                </span>
              </AppDetail>
            )}

            {ability.deploymentStatus && (
              <AppDetail label="Deployment Status">
                <span
                  className={`inline-block px-2 py-1 rounded text-sm font-semibold ${
                    ability.deploymentStatus === 'prod'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                      : ability.deploymentStatus === 'test'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                        : `${theme.itemBg} ${theme.textMuted}`
                  }`}
                  style={fonts.heading}
                >
                  {ability.deploymentStatus.toUpperCase()}
                </span>
              </AppDetail>
            )}

            {ability.createdAt && (
              <AppDetail label="Created At">
                <span className={`${theme.text} text-sm`} style={fonts.body}>
                  {new Date(ability.createdAt).toLocaleString()}
                </span>
              </AppDetail>
            )}

            {ability.updatedAt && (
              <AppDetail label="Updated At" isLast>
                <span className={`${theme.text} text-sm`} style={fonts.body}>
                  {new Date(ability.updatedAt).toLocaleString()}
                </span>
              </AppDetail>
            )}
          </div>
        </div>
      </div>

      {/* Supported Policies Card */}
      {activeVersionData?.supportedPolicies &&
        Object.keys(activeVersionData.supportedPolicies).length > 0 && (
          <div
            className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
          >
            <div className={`p-6 border-b ${theme.cardBorder}`}>
              <h3 className={`text-lg font-semibold ${theme.text} mb-1`} style={fonts.heading}>
                Supported Policies
              </h3>
              <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
                Policies compatible with this ability
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {Object.entries(activeVersionData.supportedPolicies).map(([key, value]) => (
                  <div
                    key={key}
                    className={`${theme.itemBg} px-4 py-3 rounded-lg border ${theme.cardBorder}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`font-semibold ${theme.text}`} style={fonts.heading}>
                        {key}
                      </div>
                      <a
                        href={`https://www.npmjs.com/package/${key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`rounded transition-opacity hover:opacity-80`}
                        title="View on NPM"
                      >
                        <img src="/npm.png" alt="NPM" className="h-5 w-5 object-contain" />
                      </a>
                    </div>
                    <div className={`text-sm ${theme.textMuted} font-mono`} style={fonts.body}>
                      Version: {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* Dependencies Card */}
      {activeVersionData?.dependencies && activeVersionData.dependencies.length > 0 && (
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
              {activeVersionData.dependencies.map((dep: string) => (
                <div
                  key={dep}
                  className={`text-sm ${theme.text} font-mono ${theme.itemBg} px-3 py-2 rounded`}
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
      {activeVersionData?.contributors && activeVersionData.contributors.length > 0 && (
        <div
          className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl overflow-hidden`}
        >
          <div className={`p-6 border-b ${theme.cardBorder}`}>
            <h3 className={`text-lg font-semibold ${theme.text} mb-1`} style={fonts.heading}>
              Contributors
            </h3>
            <p className={`text-sm ${theme.textMuted}`} style={fonts.body}>
              People who contributed to this ability
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {activeVersionData.contributors.map((contributor: any, index: number) => (
                <div
                  key={index}
                  className={`border-l-4 pl-4`}
                  style={{ borderColor: theme.brandOrange }}
                >
                  <div className={`font-medium ${theme.text}`} style={fonts.heading}>
                    {contributor.name}
                  </div>
                  {contributor.email && (
                    <div className={`text-sm ${theme.textMuted}`} style={fonts.body}>
                      {contributor.email}
                    </div>
                  )}
                  {contributor.url && (
                    <div className="text-sm">
                      <a
                        href={contributor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                        style={{ color: theme.brandOrange, ...fonts.body }}
                      >
                        {contributor.url}
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
