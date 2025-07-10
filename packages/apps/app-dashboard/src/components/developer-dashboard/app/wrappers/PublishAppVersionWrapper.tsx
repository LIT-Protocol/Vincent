import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAddressCheck } from '@/hooks/developer-dashboard/app/useAddressCheck';
import { reactClient as vincentApiClient } from '@lit-protocol/vincent-registry-sdk';
import { ToolVersion, PolicyVersion } from '@/types/developer-dashboard/appTypes';
import { StatusMessage } from '@/components/shared/ui/statusMessage';
import { registerApp } from '@lit-protocol/vincent-contracts-sdk';
import { ethers } from 'ethers';
import { PublishAppVersionButton } from './ui/PublishAppVersionButton';
import LoadingSkeleton from '@/components/layout/LoadingSkeleton';

export function PublishAppVersionWrapper() {
  const { appId } = useParams<{ appId: string; }>();

  // Fetching
  const {
    data: app,
    isLoading: appLoading,
    isError: appError,
  } = vincentApiClient.useGetAppQuery({ appId: Number(appId) });

  const {
    data: versionData,
    isLoading: versionLoading,
    isError: versionError,
  } = vincentApiClient.useGetAppVersionQuery({ appId: Number(appId), version: Number(app?.activeVersion) });

  const {
    data: versionTools,
    isLoading: versionToolsLoading,
    isError: versionToolsError,
  } = vincentApiClient.useListAppVersionToolsQuery({
    appId: Number(appId),
    version: Number(app?.activeVersion),
  });

  // Lazy queries for fetching tool and policy versions
  const [triggerGetToolVersion, { isLoading: toolVersionsLoading, isError: toolVersionsError }] =
    vincentApiClient.useLazyGetToolVersionQuery();
  const [triggerGetPolicyVersion, { isLoading: policiesLoading, isError: policiesError }] =
    vincentApiClient.useLazyGetPolicyVersionQuery();

  // State for storing fetched data
  const [toolVersionsData, setToolVersionsData] = useState<Record<string, ToolVersion>>({});
  const [policyVersionsData, setPolicyVersionsData] = useState<Record<string, PolicyVersion>>({});
  
  // State for publish status
  const [publishResult, setPublishResult] = useState<{
    success: boolean;
    message?: string;
  } | null>(null);

  // Fetch tool versions and policy versions when activeTools changes
  useEffect(() => {
    if (!versionTools || versionTools.length === 0) {
      setToolVersionsData({});
      setPolicyVersionsData({});
      return;
    }

    const fetchToolAndPolicyVersions = async () => {
      const toolVersions: Record<string, ToolVersion> = {};
      const policyVersions: Record<string, PolicyVersion> = {};

      // Fetch tool versions
      for (const tool of versionTools) {
        const toolVersionResult = await triggerGetToolVersion({
          packageName: tool.toolPackageName,
          version: tool.toolVersion,
        });

        const toolKey = `${tool.toolPackageName}-${tool.toolVersion}`;
        if (toolVersionResult.data) {
          toolVersions[toolKey] = toolVersionResult.data;

          // Fetch supported policies for this tool
          if (toolVersionResult.data.supportedPolicies) {
            for (const [policyPackageName, policyVersion] of Object.entries(
              toolVersionResult.data.supportedPolicies,
            )) {
              const policyVersionResult = await triggerGetPolicyVersion({
                packageName: policyPackageName,
                version: policyVersion,
              });

              const policyKey = `${policyPackageName}-${policyVersion}`;
              if (policyVersionResult.data) {
                policyVersions[policyKey] = policyVersionResult.data;
              }
            }
          }
        }
      }

      setToolVersionsData(toolVersions);
      setPolicyVersionsData(policyVersions);
    };

    fetchToolAndPolicyVersions();
  }, [versionTools, triggerGetToolVersion, triggerGetPolicyVersion]);

  // Extract IPFS CIDs from the fetched data
  const { toolIpfsCids, policyIpfsCids } = useMemo(() => {
    const toolIpfsCids: string[] = [];
    const policyIpfsCids: string[] = [];

    // Get tool IPFS CIDs
    Object.values(toolVersionsData).forEach((toolVersion) => {
      if (toolVersion.ipfsCid) {
        toolIpfsCids.push(toolVersion.ipfsCid);
      }
    });

    // Get policy IPFS CIDs
    Object.values(policyVersionsData).forEach((policyVersion) => {
      if (policyVersion.ipfsCid) {
        policyIpfsCids.push(policyVersion.ipfsCid);
      }
    });

    return {
      toolIpfsCids: [...new Set(toolIpfsCids)], // Remove duplicates
      policyIpfsCids: [...new Set(policyIpfsCids)], // Remove duplicates
    };
  }, [toolVersionsData, policyVersionsData]);

  useAddressCheck(app || null);

  // Clear error message after 3 seconds
  useEffect(() => {
    if (!publishResult || publishResult.success) return;

    const timer = setTimeout(() => {
      setPublishResult(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [publishResult]);

  // Loading states with skeleton
  if (appLoading || versionLoading || versionToolsLoading || toolVersionsLoading || policiesLoading) {
    return <LoadingSkeleton type="button" />;
  }

  // Error states
  if (appError) return <StatusMessage message="Failed to load app" type="error" />;
  if (versionError) return <StatusMessage message="Failed to load version data" type="error" />;
  if (versionToolsError)
    return <StatusMessage message="Failed to load version tools" type="error" />;
  if (toolVersionsError) return <StatusMessage message="Failed to load tool versions" type="error" />;
  if (policiesError) return <StatusMessage message="Failed to load policy versions" type="error" />;
  if (!app) return <StatusMessage message={`App ${appId} not found`} type="error" />;
  if (!versionData)
    return <StatusMessage message={`Version ${app?.activeVersion} not found`} type="error" />;

  const publishAppVersion = async () => {
    if (!appId) {
      return;
    }

    setPublishResult(null);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      
      await registerApp({
        signer: signer,
        args: {
          appId: appId.toString(),
          delegatees: app.delegateeAddresses || [],
          versionTools: {
            toolIpfsCids: toolIpfsCids,
            toolPolicies: [policyIpfsCids],
          },
        },
        overrides: {
          gasLimit: 10000000,
        },
      });

      setPublishResult({
        success: true,
        message: 'App version published successfully!'
      });
    } catch (error) {
      setPublishResult({
        success: false,
        message: 'Failed to publish app version. Please try again.'
      });
    }
  };

  return (
    <div>
      {publishResult?.success ? (
        <LoadingSkeleton 
          type="success" 
          successMessage={publishResult.message || 'Success'} 
        />
      ) : publishResult && !publishResult.success ? (
        <LoadingSkeleton 
          type="error" 
          errorMessage={publishResult.message || 'Failed to publish'} 
        />
      ) : (
        <PublishAppVersionButton onSubmit={publishAppVersion} />
      )}
    </div>
  );
}
