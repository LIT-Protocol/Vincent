import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PolicyVersionsListView } from '../views/PolicyVersionsListView';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import Loading from '@/components/shared/ui/Loading';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { PolicyVersion } from '@/types/developer-dashboard/appTypes';
import { Breadcrumb } from '@/components/shared/ui/Breadcrumb';

export function PolicyVersionsWrapper() {
  const { packageName } = useParams<{ packageName: string }>();

  // Fetch policy
  const {
    data: policy,
    isLoading: policyLoading,
    isError: policyError,
  } = vincentApiClient.useGetPolicyQuery({ packageName: packageName || '' });

  // Fetch
  const {
    data: versions,
    isLoading: versionsLoading,
    isError: versionsError,
  } = vincentApiClient.useGetPolicyVersionsQuery({ packageName: packageName || '' });

  // Separate active and deleted versions
  const { activeVersions, deletedVersions } = useMemo(() => {
    if (!versions?.length) return { activeVersions: [], deletedVersions: [] };
    const activeVersions = versions.filter((version: PolicyVersion) => !version.isDeleted);
    const deletedVersions = versions.filter((version: PolicyVersion) => version.isDeleted);

    return { activeVersions, deletedVersions };
  }, [versions]);

  // Navigation
  const navigate = useNavigate();

  // Loading states first
  if (policyLoading || versionsLoading) return <Loading />;

  // Combined error states
  if (policyError) return <StatusMessage message="Failed to load policy" type="error" />;
  if (versionsError) return <StatusMessage message="Failed to load policy versions" type="error" />;
  if (!policy) return <StatusMessage message={`Policy ${packageName} not found`} type="error" />;
  if (!versions) return <StatusMessage message="No policy versions found" type="info" />;

  const handleVersionClick = (version: string) => {
    navigate(`/developer/policies/policy/${encodeURIComponent(packageName!)}/version/${version}`);
  };

  const handleCreateVersion = () => {
    navigate(
      `/developer/policies/policy/${encodeURIComponent(packageName!)}?action=create-policy-version`,
    );
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Policies', onClick: () => navigate('/developer/policies') },
          {
            label: policy.title || policy.packageName,
            onClick: () =>
              navigate(`/developer/policies/policy/${encodeURIComponent(packageName!)}`),
          },
          { label: 'Versions' },
        ]}
      />
      <PolicyVersionsListView
        activeVersions={activeVersions}
        deletedVersions={deletedVersions}
        policy={policy}
        onVersionClick={handleVersionClick}
        onCreateVersion={handleCreateVersion}
      />
    </>
  );
}
