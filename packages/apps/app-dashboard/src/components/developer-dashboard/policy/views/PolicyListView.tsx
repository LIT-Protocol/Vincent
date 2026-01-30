import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate } from '@/utils/developer-dashboard/formatDateAndTime';
import { UndeletePolicyButton } from '../wrappers';
import { Policy } from '@/types/developer-dashboard/appTypes';
import { theme, fonts } from '@/lib/themeClasses';
import { PolicyCard } from '../../ui/PolicyCard';
import { Logo } from '@/components/shared/ui/Logo';

interface PolicyListViewProps {
  policies: Policy[];
  deletedPolicies: Policy[];
  onCreatePolicy: () => void;
}

export function PolicyListView({ policies, deletedPolicies, onCreatePolicy }: PolicyListViewProps) {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setShowContent(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: showContent ? 1 : 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="w-full space-y-8"
    >
      {policies.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px] w-full">
          <div className="text-center max-w-md mx-auto px-6">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${theme.itemBg} border ${theme.cardBorder} mb-6`}
            >
              <Shield className={`w-8 h-8 ${theme.textMuted}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${theme.text}`} style={fonts.heading}>
              No Policies Yet
            </h3>
            <p className={`text-sm ${theme.textMuted} leading-relaxed mb-6`} style={fonts.body}>
              Create your first policy to get started with Vincent.
            </p>
            <button
              onClick={onCreatePolicy}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors inline-flex items-center gap-2"
              style={{ backgroundColor: theme.brandOrange, ...fonts.heading }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.brandOrange;
              }}
            >
              <Plus className="h-4 w-4" />
              Create Policy
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {policies.map((policy) => (
              <PolicyCard
                key={policy.packageName}
                onClick={() =>
                  navigate(`/developer/policies/policy/${encodeURIComponent(policy.packageName)}`)
                }
              >
                <div className="flex items-start gap-3 mb-4">
                  <Logo
                    logo={policy.logo}
                    alt={`${policy.packageName} logo`}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold ${theme.text} truncate text-lg mb-1`}
                      style={fonts.heading}
                    >
                      {policy.packageName}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-md ${theme.itemBg}`}
                      style={fonts.body}
                    >
                      v{policy.activeVersion}
                    </span>
                  </div>
                </div>
                <p className={`text-sm ${theme.textMuted} line-clamp-2 mb-3`} style={fonts.body}>
                  {policy.description || 'No description available'}
                </p>
                <div className={`text-xs ${theme.textSubtle}`} style={fonts.body}>
                  Created: {formatDate(policy.createdAt)}
                </div>
              </PolicyCard>
            ))}
          </div>

          {/* Create Another Policy CTA */}
          <div className="pt-8 border-t border-gray-200 dark:border-white/10">
            <div className="flex flex-col items-center justify-center py-6">
              <h3 className={`text-lg font-semibold ${theme.text} mb-4`} style={fonts.heading}>
                Ready to create another policy?
              </h3>
              <button
                onClick={onCreatePolicy}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors inline-flex items-center gap-2"
                style={{ backgroundColor: theme.brandOrange, ...fonts.heading }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.brandOrange;
                }}
              >
                <Plus className="h-4 w-4" />
                Create Policy
              </button>
            </div>
          </div>
        </>
      )}
      {/* Deleted Policies Section */}
      {deletedPolicies && deletedPolicies.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/10">
          <h3 className={`text-lg font-semibold ${theme.textMuted} mb-4`} style={fonts.heading}>
            Deleted Policies
          </h3>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {deletedPolicies.map((policy) => (
              <PolicyCard key={policy.packageName} variant="deleted">
                <div className="flex items-start gap-3 mb-4">
                  <Logo
                    logo={policy.logo}
                    alt={`${policy.packageName} logo`}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold ${theme.text} truncate text-lg mb-1`}
                      style={fonts.heading}
                    >
                      {policy.packageName}
                    </h3>
                    <div className="flex gap-2 items-center flex-wrap">
                      <span
                        className={`text-xs px-2 py-1 rounded-md ${theme.itemBg}`}
                        style={fonts.body}
                      >
                        v{policy.activeVersion}
                      </span>
                      <span
                        className="text-xs px-2 py-1 rounded-md bg-red-500/10 text-red-500 dark:text-red-400"
                        style={fonts.body}
                      >
                        Deleted
                      </span>
                    </div>
                  </div>
                </div>
                <p className={`text-sm ${theme.textMuted} line-clamp-2 mb-3`} style={fonts.body}>
                  {policy.description || 'No description available'}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <div className={`text-xs ${theme.textSubtle}`} style={fonts.body}>
                    Created: {formatDate(policy.createdAt)}
                  </div>
                  <UndeletePolicyButton policy={policy} />
                </div>
              </PolicyCard>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
