import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';

import { AppVersionsListView } from '../views/AppVersionsListView';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { AppVersion } from '@/types/developer-dashboard/appTypes';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';
import { useBlockchainAppVersionsData } from '@/hooks/useBlockchainAppVersionsData';

type SortOption = 'published' | 'enabled';

export function AppVersionsWrapper() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortOption>('published');

  // Fetch app
  const {
    data: app,
    isLoading: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  // Fetch app versions
  const {
    data: versions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetAppVersionsQuery({ appId: Number(appId) });

  // Fetch blockchain data for all versions
  const { blockchainVersions, blockchainVersionsLoading, blockchainVersionsError } =
    useBlockchainAppVersionsData(Number(appId), versions);

  // Separate active and deleted versions
  const { activeVersions, deletedVersions } = useMemo(() => {
    if (!versions?.length) return { activeVersions: [], deletedVersions: [] };
    const activeVersions = versions.filter((version: AppVersion) => !version.isDeleted);
    const deletedVersions = versions.filter((version: AppVersion) => version.isDeleted);
    return { activeVersions, deletedVersions };
  }, [versions]);

  // Loading states first
  if (appLoading || versionsLoading || blockchainVersionsLoading) return <Loading />;

  // Combined error states
  if (appError) return <StatusMessage message="Failed to load app" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load app versions" type="error" />;
  if (blockchainVersionsError)
    return <StatusMessage message={blockchainVersionsError} type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;

  const handleVersionClick = (version: number) => {
    navigate(`/developer/apps/appId/${appId}/version/${version}`);
  };

  const handleCreateVersion = () => {
    navigate(`/developer/apps/appId/${appId}?action=create-app-version`);
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Apps', onClick: () => navigate('/developer/apps') },
          { label: app.name, onClick: () => navigate(`/developer/apps/appId/${appId}`) },
          { label: 'Versions' },
        ]}
      />
      <AppVersionsListView
        appName={app.name}
        versions={activeVersions}
        deletedVersions={deletedVersions}
        activeVersion={app.activeVersion}
        onVersionClick={handleVersionClick}
        onCreateVersion={handleCreateVersion}
        blockchainVersions={blockchainVersions}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
    </>
  );
}
