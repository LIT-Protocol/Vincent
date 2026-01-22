import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { getClient, AppVersion } from '@lit-protocol/vincent-contracts-sdk';
import { readOnlySigner } from '@/utils/developer-dashboard/readOnlySigner';
import { useWagmiSigner } from '@/hooks/developer-dashboard/useWagmiSigner';
import { registryUrl } from '@/config/registry';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import { Button } from '@/components/shared/ui/button';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { theme, fonts } from '@/lib/themeClasses';
import { CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react';
import { PackageInstallCommand } from './ui/PackageInstallCommand';

interface AbilityInfo {
  title: string;
  packageName: string;
  version: string;
  ipfsCid: string;
}

export function AppVersionDetailsWrapper() {
  const { appId, version } = useParams<{ appId: string; version: string }>();
  const navigate = useNavigate();
  const { getSigner } = useWagmiSigner();

  const [versionData, setVersionData] = useState<AppVersion | null>(null);
  const [abilityInfoMap, setAbilityInfoMap] = useState<Map<string, AbilityInfo>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  // Fetch app from registry for name/metadata
  const { data: app } = vincentApiClient.useGetAppQuery({ appId: Number(appId) }, { skip: !appId });

  // Fetch all abilities from registry to build lookup map
  const { data: allAbilities } = vincentApiClient.useListAllAbilitiesQuery();

  // Fetch version from on-chain and resolve ability info
  useEffect(() => {
    async function fetchVersion() {
      if (!appId || !version) {
        setFetchError('App ID and version are required');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setFetchError(null);

      try {
        const client = getClient({ signer: readOnlySigner });
        const result = await client.getAppVersion({
          appId: Number(appId),
          version: Number(version),
        });

        if (result === null) {
          setFetchError('Version not found on-chain');
          setVersionData(null);
          setIsLoading(false);
          return;
        }

        setVersionData(result.appVersion);

        // Now look up ability info for each IPFS CID
        const infoMap = new Map<string, AbilityInfo>();

        for (const ability of result.appVersion.abilities) {
          const ipfsCid = ability.abilityIpfsCid;

          // Try to find the ability in the registry by checking versions
          if (allAbilities) {
            for (const registryAbility of allAbilities) {
              try {
                // Fetch all versions for this ability
                const versionsResponse = await fetch(
                  `${registryUrl}/ability/${encodeURIComponent(registryAbility.packageName)}/versions`,
                );

                if (versionsResponse.ok) {
                  const versions = await versionsResponse.json();
                  const matchingVersion = versions.find((v: any) => v.ipfsCid === ipfsCid);

                  if (matchingVersion) {
                    infoMap.set(ipfsCid, {
                      title: registryAbility.title,
                      packageName: registryAbility.packageName,
                      version: matchingVersion.version,
                      ipfsCid,
                    });
                    break;
                  }
                }
              } catch (err) {
                // Continue to next ability
              }
            }
          }

          // If not found, use placeholder
          if (!infoMap.has(ipfsCid)) {
            infoMap.set(ipfsCid, {
              title: 'Unknown Ability',
              packageName: 'Unknown',
              version: 'Unknown',
              ipfsCid,
            });
          }
        }

        setAbilityInfoMap(infoMap);
      } catch (err: any) {
        setFetchError(`Failed to fetch version: ${err.message}`);
        setVersionData(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (allAbilities !== undefined) {
      fetchVersion();
    }
  }, [appId, version, allAbilities]);

  const handleToggleEnabled = async () => {
    if (!versionData || !appId || !version) return;

    setIsToggling(true);
    setToggleError(null);

    try {
      const signer = await getSigner();
      const client = getClient({ signer });

      await client.enableAppVersion({
        appId: Number(appId),
        appVersion: Number(version),
        enabled: !versionData.enabled,
      });

      // Update local state
      setVersionData({
        ...versionData,
        enabled: !versionData.enabled,
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

  if (isLoading) {
    return <Loading />;
  }

  if (fetchError) {
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
        <StatusMessage message={fetchError} type="error" />
      </>
    );
  }

  if (!versionData) {
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
                versionData.enabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {versionData.enabled ? (
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
            variant={versionData.enabled ? 'outline' : 'default'}
            className={versionData.enabled ? '' : 'text-white'}
            style={versionData.enabled ? {} : { backgroundColor: theme.brandOrange }}
          >
            {isToggling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {versionData.enabled ? 'Disabling...' : 'Enabling...'}
              </>
            ) : versionData.enabled ? (
              'Disable Version'
            ) : (
              'Enable Version'
            )}
          </Button>
        </div>
        {toggleError && (
          <div className="mt-4">
            <StatusMessage message={toggleError} type="error" />
          </div>
        )}
      </div>

      {/* Abilities Section */}
      <div className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl p-6`}>
        <h2 className={`text-lg font-semibold mb-4 ${theme.text}`} style={fonts.heading}>
          Abilities ({versionData.abilities.length})
        </h2>

        {versionData.abilities.length === 0 ? (
          <p className={`${theme.textMuted}`} style={fonts.body}>
            No abilities configured for this version.
          </p>
        ) : (
          <div className="space-y-3">
            {versionData.abilities.map((ability) => {
              const info = abilityInfoMap.get(ability.abilityIpfsCid);

              return (
                <div
                  key={ability.abilityIpfsCid}
                  className={`p-4 rounded-lg ${theme.itemBg} border ${theme.cardBorder}`}
                >
                  <div className="space-y-2">
                    {/* Title */}
                    <div className={`font-semibold ${theme.text}`} style={fonts.heading}>
                      {info?.title || 'Unknown Ability'}
                    </div>

                    {/* Package Name */}
                    <div className={`text-sm`} style={fonts.body}>
                      {info?.packageName && info.packageName !== 'Unknown' ? (
                        <a
                          href={`https://www.npmjs.com/package/${info.packageName}${info.version && info.version !== 'Unknown' ? `/v/${info.version}` : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                          style={{ color: theme.brandOrange }}
                        >
                          {info.packageName}
                          {info.version && info.version !== 'Unknown' && ` v${info.version}`}
                        </a>
                      ) : (
                        <span className={theme.textMuted}>Unknown</span>
                      )}
                    </div>

                    {/* IPFS CID */}
                    <div className="flex items-center gap-2">
                      <code className={`text-xs ${theme.textMuted} font-mono`}>
                        {ability.abilityIpfsCid}
                      </code>
                      <a
                        href={`https://ipfs.io/ipfs/${ability.abilityIpfsCid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                        title="View on IPFS"
                      >
                        <ExternalLink className="w-4 h-4" style={{ color: theme.brandOrange }} />
                      </a>
                    </div>

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
              );
            })}
          </div>
        )}

        {/* Package Install Command */}
        {versionData.abilities.length > 0 && (
          <div className="mt-6">
            <PackageInstallCommand
              versionAbilities={versionData.abilities
                .map((ability) => {
                  const info = abilityInfoMap.get(ability.abilityIpfsCid);
                  return {
                    abilityPackageName: info?.packageName || '',
                    abilityVersion: info?.version || '',
                    isDeleted: false,
                  };
                })
                .filter((a) => a.abilityPackageName && a.abilityVersion)}
              abilityVersionsData={{}}
            />
          </div>
        )}
      </div>
    </>
  );
}
