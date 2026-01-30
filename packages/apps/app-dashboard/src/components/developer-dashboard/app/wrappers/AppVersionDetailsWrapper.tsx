import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { getClient, AppVersion } from '@lit-protocol/vincent-contracts-sdk';
import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import { useWagmiSigner } from '@/hooks/developer-dashboard/useWagmiSigner';
import { useEnsureChain } from '@/hooks/developer-dashboard/useEnsureChain';
import { registryUrl } from '@/config/registry';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import { Button } from '@/components/shared/ui/button';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { theme, fonts } from '@/lib/themeClasses';
import { CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react';
import { PackageInstallCommand } from './ui/PackageInstallCommand';

interface AbilityDisplayData {
  title: string;
  packageName: string;
  version: string;
  ipfsCid: string;
  policyIpfsCids: string[];
}

export function AppVersionDetailsWrapper() {
  const { appId, version } = useParams<{ appId: string; version: string }>();
  const navigate = useNavigate();
  const { getSigner } = useWagmiSigner();
  const { ensureChain, infoMessage } = useEnsureChain();

  // On-chain state (for enabled status)
  const [onChainVersion, setOnChainVersion] = useState<AppVersion | null>(null);
  const [onChainLoading, setOnChainLoading] = useState(true);
  const [onChainError, setOnChainError] = useState<string | null>(null);

  // Combined ability data
  const [abilities, setAbilities] = useState<AbilityDisplayData[]>([]);
  const [abilitiesLoading, setAbilitiesLoading] = useState(true);

  // Toggle state
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  // Fetch app from registry for name/metadata
  const { data: app } = vincentApiClient.useGetAppQuery({ appId: Number(appId) }, { skip: !appId });

  // Fetch AppVersionAbilities from registry (has packageName, version directly)
  const {
    data: versionAbilities,
    isLoading: versionAbilitiesLoading,
    error: versionAbilitiesError,
  } = vincentApiClient.useListAppVersionAbilitiesQuery(
    { appId: Number(appId), version: Number(version) },
    { skip: !appId || !version },
  );

  // Fetch on-chain version for enabled status and policy CIDs
  useEffect(() => {
    async function fetchOnChainVersion() {
      if (!appId || !version) {
        setOnChainError('App ID and version are required');
        setOnChainLoading(false);
        return;
      }

      setOnChainLoading(true);
      setOnChainError(null);

      try {
        const client = getClient({ signer: readOnlySigner });
        const result = await client.getAppVersion({
          appId: Number(appId),
          version: Number(version),
        });

        if (result === null) {
          setOnChainError('Version not found on-chain');
          setOnChainVersion(null);
        } else {
          setOnChainVersion(result.appVersion);
        }
      } catch (err: any) {
        setOnChainError(`Failed to fetch version: ${err.message}`);
        setOnChainVersion(null);
      } finally {
        setOnChainLoading(false);
      }
    }

    fetchOnChainVersion();
  }, [appId, version]);

  // Build ability display data by combining registry and on-chain data
  useEffect(() => {
    async function buildAbilityData() {
      if (!versionAbilities || !onChainVersion) {
        setAbilitiesLoading(false);
        return;
      }

      setAbilitiesLoading(true);

      try {
        // Build a map of ipfsCid -> policyIpfsCids from on-chain data
        const policyMap = new Map<string, string[]>();
        for (const onChainAbility of onChainVersion.abilities) {
          policyMap.set(onChainAbility.abilityIpfsCid, onChainAbility.policyIpfsCids);
        }

        // For each registry ability, fetch additional metadata
        const abilityDataPromises = versionAbilities.map(async (va) => {
          try {
            // Fetch Ability for title
            const abilityResponse = await fetch(
              `${registryUrl}/ability/${encodeURIComponent(va.abilityPackageName)}`,
            );
            const ability = abilityResponse.ok ? await abilityResponse.json() : null;

            // Fetch AbilityVersion for ipfsCid
            const versionResponse = await fetch(
              `${registryUrl}/ability/${encodeURIComponent(va.abilityPackageName)}/version/${encodeURIComponent(va.abilityVersion)}`,
            );
            const abilityVersion = versionResponse.ok ? await versionResponse.json() : null;

            const ipfsCid = abilityVersion?.ipfsCid || '';

            return {
              title: ability?.title || va.abilityPackageName,
              packageName: va.abilityPackageName,
              version: va.abilityVersion,
              ipfsCid,
              policyIpfsCids: policyMap.get(ipfsCid) || [],
            };
          } catch {
            return {
              title: va.abilityPackageName,
              packageName: va.abilityPackageName,
              version: va.abilityVersion,
              ipfsCid: '',
              policyIpfsCids: [],
            };
          }
        });

        const abilityData = await Promise.all(abilityDataPromises);
        setAbilities(abilityData);
      } catch (err) {
        console.error('Failed to build ability data:', err);
      } finally {
        setAbilitiesLoading(false);
      }
    }

    if (!versionAbilitiesLoading && !onChainLoading) {
      buildAbilityData();
    }
  }, [versionAbilities, onChainVersion, versionAbilitiesLoading, onChainLoading]);

  const handleToggleEnabled = async () => {
    if (!onChainVersion || !appId || !version) return;

    // Ensure user is on Base Sepolia before starting
    const action = onChainVersion.enabled ? 'Disable Version' : 'Enable Version';
    try {
      const canProceed = await ensureChain(action);
      if (!canProceed) return;
    } catch (error) {
      setToggleError(error instanceof Error ? error.message : 'Failed to switch network');
      return;
    }

    setIsToggling(true);
    setToggleError(null);

    try {
      const signer = await getSigner();
      const client = getClient({ signer });

      await client.enableAppVersion({
        appId: Number(appId),
        appVersion: Number(version),
        enabled: !onChainVersion.enabled,
      });

      // Update local state
      setOnChainVersion({
        ...onChainVersion,
        enabled: !onChainVersion.enabled,
      });
    } catch (err: any) {
      console.error('Failed to toggle version enabled state:', err);

      let errorMessage = 'Failed to update version';
      if (err.code === 'ACTION_REJECTED' || err.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected';
      } else if (err.message) {
        errorMessage = err.message.substring(0, 100);
      }
      setToggleError(errorMessage);
    } finally {
      setIsToggling(false);
    }
  };

  const isLoading = onChainLoading || versionAbilitiesLoading || abilitiesLoading;

  if (isLoading) {
    return <Loading />;
  }

  if (onChainError || versionAbilitiesError) {
    const errorMessage = onChainError || 'Failed to load version abilities';
    return (
      <>
        <Breadcrumb
          items={[
            { label: 'Apps', onClick: () => navigate('/developer/apps') },
            { label: `App ${appId}`, onClick: () => navigate(`/developer/apps/appId/${appId}`) },
            {
              label: 'Versions',
              onClick: () => navigate(`/developer/apps/appId/${appId}/versions`),
            },
          ]}
        />
        <StatusMessage message={errorMessage} type="error" />
      </>
    );
  }

  if (!onChainVersion) {
    return (
      <>
        <Breadcrumb
          items={[
            { label: 'Apps', onClick: () => navigate('/developer/apps') },
            {
              label: app?.name || `App ${appId}`,
              onClick: () => navigate(`/developer/apps/appId/${appId}`),
            },
            {
              label: 'Versions',
              onClick: () => navigate(`/developer/apps/appId/${appId}/versions`),
            },
          ]}
        />
        <StatusMessage message="Version not found" type="error" />
      </>
    );
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Apps', onClick: () => navigate('/developer/apps') },
          {
            label: app?.name || `App ${appId}`,
            onClick: () => navigate(`/developer/apps/appId/${appId}`),
          },
          { label: 'Versions', onClick: () => navigate(`/developer/apps/appId/${appId}/versions`) },
          { label: `Version ${version}` },
        ]}
      />

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className={`text-2xl font-bold ${theme.text}`} style={fonts.heading}>
              Version {version}
            </h1>
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                onChainVersion.enabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {onChainVersion.enabled ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Enabled
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  Disabled
                </>
              )}
            </div>
          </div>
          <Button
            onClick={handleToggleEnabled}
            disabled={isToggling}
            variant={onChainVersion.enabled ? 'outline' : 'default'}
            className={onChainVersion.enabled ? '' : 'text-white'}
            style={onChainVersion.enabled ? {} : { backgroundColor: theme.brandOrange }}
          >
            {isToggling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {onChainVersion.enabled ? 'Disabling...' : 'Enabling...'}
              </>
            ) : onChainVersion.enabled ? (
              'Disable Version'
            ) : (
              'Enable Version'
            )}
          </Button>
        </div>
        {infoMessage && (
          <div className="mt-4">
            <StatusMessage message={infoMessage} type="info" />
          </div>
        )}
        {toggleError && (
          <div className="mt-4">
            <StatusMessage message={toggleError} type="error" />
          </div>
        )}
      </div>

      {/* Abilities Section */}
      <div className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl p-6`}>
        <h2 className={`text-lg font-semibold mb-4 ${theme.text}`} style={fonts.heading}>
          Abilities ({abilities.length})
        </h2>

        {abilities.length === 0 ? (
          <p className={`${theme.textMuted}`} style={fonts.body}>
            No abilities configured for this version.
          </p>
        ) : (
          <div className="space-y-3">
            {abilities.map((ability) => (
              <div
                key={ability.packageName}
                className={`p-4 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}
              >
                <div className="space-y-2">
                  {/* Title */}
                  <div className={`font-semibold ${theme.text}`} style={fonts.heading}>
                    {ability.title}
                  </div>

                  {/* Package Name */}
                  <div className={`text-sm`} style={fonts.body}>
                    <a
                      href={`https://www.npmjs.com/package/${ability.packageName}/v/${ability.version}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      style={{ color: theme.brandOrange }}
                    >
                      {ability.packageName} v{ability.version}
                    </a>
                  </div>

                  {/* IPFS CID */}
                  {ability.ipfsCid && (
                    <div className="flex items-center gap-2">
                      <code className={`text-xs ${theme.textMuted} font-mono`}>
                        {ability.ipfsCid}
                      </code>
                      <a
                        href={`https://ipfs.io/ipfs/${ability.ipfsCid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                        title="View on IPFS"
                      >
                        <ExternalLink className="w-4 h-4" style={{ color: theme.brandOrange }} />
                      </a>
                    </div>
                  )}

                  {/* Policies */}
                  {ability.policyIpfsCids.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
                      <div className={`text-xs font-medium ${theme.textMuted} mb-2`}>
                        Policies ({ability.policyIpfsCids.length})
                      </div>
                      <div className="space-y-1">
                        {ability.policyIpfsCids.map((policyCid) => (
                          <div key={policyCid} className="flex items-center gap-2">
                            <code className={`text-xs ${theme.textMuted} font-mono`}>
                              {policyCid}
                            </code>
                            <a
                              href={`https://ipfs.io/ipfs/${policyCid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0"
                              title="View on IPFS"
                            >
                              <ExternalLink
                                className="w-3.5 h-3.5"
                                style={{ color: theme.brandOrange }}
                              />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Package Install Command */}
        {abilities.length > 0 && (
          <div className="mt-6">
            <PackageInstallCommand
              versionAbilities={abilities.map((ability) => ({
                abilityPackageName: ability.packageName,
                abilityVersion: ability.version,
                isDeleted: false,
              }))}
              abilityVersionsData={{}}
            />
          </div>
        )}
      </div>
    </>
  );
}
