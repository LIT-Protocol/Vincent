import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { useBlockchainAppVersions } from '@/hooks/useBlockchainAppVersions';
import { Button } from '@/components/shared/ui/button';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import Loading from '@/components/shared/ui/Loading';
import { theme, fonts } from '@/lib/themeClasses';
import { CheckCircle } from 'lucide-react';

interface SetActiveVersionFormProps {
  currentActiveVersion?: number | null;
  onSuccess: () => void;
}

export function SetActiveVersionForm({
  currentActiveVersion,
  onSuccess,
}: SetActiveVersionFormProps) {
  const { appId } = useParams<{ appId: string }>();
  const [selectedVersion, setSelectedVersion] = useState<number | null>(
    currentActiveVersion ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: versionData,
    isLoading,
    error: fetchError,
  } = useBlockchainAppVersions(Number(appId));
  const [setAppActiveVersion] = vincentApiClient.useSetAppActiveVersionMutation();

  const handleSubmit = async () => {
    if (!selectedVersion || !appId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await setAppActiveVersion({
        appId: Number(appId),
        appSetActiveVersion: { activeVersion: selectedVersion },
      }).unwrap();

      onSuccess();
    } catch (err: any) {
      console.error('Failed to set active version:', err);
      setError(err.data?.message || err.message || 'Failed to set active version');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (fetchError) {
    return <StatusMessage message={fetchError} type="error" />;
  }

  // Filter to only show enabled versions (published on-chain)
  const enabledVersions = versionData?.versions.filter((v) => v.enabled) || [];

  if (enabledVersions.length === 0) {
    return (
      <div className="text-center py-6">
        <p className={`${theme.textMuted} mb-4`} style={fonts.body}>
          No published versions available. You need to publish at least one version before setting
          it as active.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <StatusMessage message={error} type="error" />}

      <div>
        <label className={`block text-sm font-medium ${theme.text} mb-2`} style={fonts.heading}>
          Select Version
        </label>
        <p className={`text-sm ${theme.textMuted} mb-3`} style={fonts.body}>
          Choose which version users will see when they install your app. Only published (enabled)
          versions can be set as active.
        </p>
        <div className="space-y-2">
          {enabledVersions.map((version) => {
            const versionNumber = versionData?.versions.indexOf(version) ?? 0;
            const actualVersion = versionNumber + 1;
            const isCurrentActive = actualVersion === currentActiveVersion;
            const isSelected = actualVersion === selectedVersion;

            return (
              <button
                key={actualVersion}
                type="button"
                onClick={() => setSelectedVersion(actualVersion)}
                className={`w-full p-4 rounded-lg border text-left transition-all ${
                  isSelected
                    ? `border-2 ${theme.mainCardBorder}`
                    : `border ${theme.cardBorder} hover:border-gray-400 dark:hover:border-gray-500`
                }`}
                style={isSelected ? { borderColor: theme.brandOrange } : {}}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${theme.text}`} style={fonts.heading}>
                        Version {actualVersion}
                      </span>
                      {isCurrentActive && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          style={fonts.body}
                        >
                          Current Active
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${theme.textMuted} mt-1`} style={fonts.body}>
                      {version.abilities.length}{' '}
                      {version.abilities.length === 1 ? 'ability' : 'abilities'}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5" style={{ color: theme.brandOrange }} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedVersion || selectedVersion === currentActiveVersion}
          className="text-white"
          style={{ backgroundColor: theme.brandOrange }}
        >
          {isSubmitting ? 'Updating...' : 'Set Active Version'}
        </Button>
      </div>
    </div>
  );
}
