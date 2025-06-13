import { FormRenderer } from './FormRenderer';
import { CreateApp, CreateAppVersion, EditApp, DeleteApp } from '../schemas/app';
import { vincentApiClient } from '../vincentApiClient';
import { z } from 'zod';
import { useUrlAppId } from '@/hooks/user-dashboard/useUrlAppId';
import { useAccount } from 'wagmi';
import { VersionChanges } from '../schemas/base';
import { useParams } from 'react-router-dom';
import Loading from '@/layout/app-dashboard/Loading';
import { StatusMessage } from '@/utils/shared/statusMessage';
import { useState } from 'react';

export function CreateAppForm() {
  const [createApp, { isLoading }] = vincentApiClient.useCreateAppMutation();
  const { address, isConnected } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Show loading if wallet is not connected yet (required for creating apps)
  if (!isConnected || !address) {
    return <Loading />;
  }

  const handleSubmit = async (data: any) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }

    setError(null);
    setResult(null);

    try {
      // Generate appId and prepare app data
      const appId = Math.floor(Math.random() * 10000);
      const appDataForApi = {
        ...data,
        appId,
        managerAddress: address,
      };

      const response = await createApp({
        createApp: appDataForApi,
      }).unwrap();

      setResult(response);
      // Refresh the page after successful submission
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to create app');
    }
  };

  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  if (result) {
    return <StatusMessage message="App created successfully! Refreshing page..." type="success" />;
  }

  return (
    <div>
      <FormRenderer
        schema={CreateApp}
        onSubmit={handleSubmit}
        title="Create App"
        description="Create a new blockchain application"
        defaultValues={{
          redirectUris: [''],
          tools: [],
          managerAddress: address || '',
        }}
        hiddenFields={['managerAddress', 'appId']}
        isLoading={isLoading}
      />
    </div>
  );
}

export function EditAppForm({
  appData,
  hideHeader = false,
}: {
  appData?: any;
  hideHeader?: boolean;
}) {
  const [editApp, { isLoading }] = vincentApiClient.useEditAppMutation();
  const { address, isConnected } = useAccount();
  const { appId } = useUrlAppId();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Show loading if we don't have appData yet (required for editing)
  if (!appData) {
    return <Loading />;
  }

  const handleSubmit = async (data: any) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }

    if (!appId) {
      setError('No app ID found in URL');
      return;
    }

    setError(null);
    setResult(null);

    try {
      const { ...editAppData } = data;
      const response = await editApp({
        appId: parseInt(appId),
        createApp: { ...editAppData, managerAddress: address },
      }).unwrap();

      setResult(response);
      // Refresh the page after successful submission
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to update app');
    }
  };

  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  if (result) {
    return <StatusMessage message="App updated successfully! Refreshing page..." type="success" />;
  }

  return (
    <FormRenderer
      schema={EditApp}
      onSubmit={handleSubmit}
      title="Edit App"
      description="Update an existing application"
      defaultValues={{
        redirectUris: [''],
      }}
      appData={appData}
      isLoading={isLoading}
      hideHeader={hideHeader}
    />
  );
}

export function GetAppForm() {
  const [getApp, { isLoading }] = vincentApiClient.useLazyGetAppQuery();
  const { appId } = useUrlAppId();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Show loading if we don't have appId yet (required for the API call)
  if (!appId) {
    return <Loading />;
  }

  const handleSubmit = async () => {
    setError(null);
    setResult(null);

    try {
      const data = await getApp({ appId: parseInt(appId) }).unwrap();
      setResult(data);
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to get app');
    }
  };

  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  if (result) {
    return (
      <div>
        <StatusMessage message="App retrieved successfully!" type="success" />
        <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  }

  // Create a minimal schema for the form (no fields needed since appId comes from URL)
  const EmptySchema = z.object({});

  return (
    <div>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-blue-800">App ID from URL: {appId}</p>
      </div>
      <FormRenderer
        schema={EmptySchema}
        onSubmit={handleSubmit}
        title="Get App"
        description="Fetch an application by its ID from the URL"
        isLoading={isLoading}
      />
    </div>
  );
}

export function DeleteAppForm({
  appData,
  hideHeader = false,
}: {
  appData?: any;
  hideHeader?: boolean;
}) {
  const [deleteApp, { isLoading }] = vincentApiClient.useDeleteAppMutation();
  const { appId } = useUrlAppId();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Show loading if we don't have appData yet (required for deletion context)
  if (!appData) {
    return <Loading />;
  }

  const handleSubmit = async (data: any) => {
    if (!appId) {
      setError('No app ID found in URL');
      return;
    }

    // Additional validation - check if the confirmation matches
    const expectedConfirmation = `I want to delete app ${appId}`;
    if (data.confirmation !== expectedConfirmation) {
      setError(`Please type exactly: "${expectedConfirmation}"`);
      return;
    }

    // Confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete app ID ${appId}? This action cannot be undone.`,
    );
    if (!confirmDelete) {
      return;
    }

    setError(null);
    setResult(null);

    try {
      const response = await deleteApp({
        appId: parseInt(appId),
      }).unwrap();

      setResult(response);
      // Navigate back to dashboard after successful deletion
      setTimeout(() => (window.location.href = '/developer'), 2000);
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to delete app');
    }
  };

  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  if (result) {
    return (
      <StatusMessage
        message="App deleted successfully! Redirecting to dashboard..."
        type="success"
      />
    );
  }

  return (
    <FormRenderer
      schema={DeleteApp(appId || '0')}
      onSubmit={handleSubmit}
      title="Delete App"
      description="Delete an application permanently"
      hiddenFields={[]}
      isLoading={isLoading}
      hideHeader={hideHeader}
    />
  );
}

export function CreateAppVersionForm({
  appData,
  hideHeader = false,
}: {
  appData?: any;
  hideHeader?: boolean;
}) {
  const [createAppVersion, { isLoading }] = vincentApiClient.useCreateAppVersionMutation();
  const { appId } = useUrlAppId();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Show loading if we don't have appData yet (required for context)
  if (!appData) {
    return <Loading />;
  }

  const handleSubmit = async (data: any) => {
    if (!appId) {
      setError('No app ID found in URL');
      return;
    }

    setError(null);
    setResult(null);

    try {
      const { ...versionDataForApi } = data;
      const response = await createAppVersion({
        appId: parseInt(appId),
        createAppVersion: versionDataForApi,
      }).unwrap();

      setResult(response);
      // Refresh the page after successful submission
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to create app version');
    }
  };

  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  if (result) {
    return (
      <StatusMessage
        message="App version created successfully! Refreshing page..."
        type="success"
      />
    );
  }

  return (
    <FormRenderer
      schema={CreateAppVersion}
      onSubmit={handleSubmit}
      title="Create App Version"
      description="Create a new version of an application"
      defaultValues={{
        tools: [''],
      }}
      appData={appData}
      isLoading={isLoading}
      hideHeader={hideHeader}
    />
  );
}

export function GetAppVersionsForm() {
  const [getAppVersions, { isLoading }] = vincentApiClient.useLazyGetAppVersionsQuery();
  const { appId } = useUrlAppId();

  // Show loading if we don't have appId yet (required for the API call)
  if (!appId) {
    return <Loading />;
  }

  const handleSubmit = async () => {
    try {
      const result = await getAppVersions({ appId: parseInt(appId) }).unwrap();
      alert(`Success! Retrieved versions: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  const EmptySchema = z.object({});

  return (
    <div>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-blue-800">App ID from URL: {appId}</p>
      </div>
      <FormRenderer
        schema={EmptySchema}
        onSubmit={handleSubmit}
        title="Get App Versions"
        description="Fetch all versions of an application"
        isLoading={isLoading}
      />
    </div>
  );
}

/*
// Commenting this out becuase we'll never actually have a form to get a specific version of an app
// The actual implementation will get ALL versions, render them as a list, and have users click to
// directly hit the API to get a specific version.

export function GetAppVersionForm() {
  const [getAppVersion, { isLoading }] = vincentApiClient.useLazyGetAppVersionQuery();
  const { appId } = useUrlAppId();

  const GetAppVersion = z.object({
  version: z.number().openapi({
    description: 'Application version number',
    example: 1,
  }),
});


  const handleSubmit = async (data: any) => {
    if (!appId) {
      alert('Error: No app ID found in URL');
      return;
    }

    try {
      const result = await getAppVersion({
        appId: parseInt(appId),
        version: data.version,
      }).unwrap();
      alert(`Success! Retrieved version: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  return (
    <div>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-blue-800">App ID from URL: {appId}</p>
      </div>
      <FormRenderer
        schema={GetAppVersion}
        onSubmit={handleSubmit}
        title="Get App Version"
        description="Fetch a specific version of an application"
        isLoading={isLoading}
      />
    </div>
  );
}
*/

export function EditAppVersionForm({ hideHeader = false }: { hideHeader?: boolean }) {
  const [editAppVersion, { isLoading }] = vincentApiClient.useEditAppVersionMutation();
  const { appId } = useUrlAppId();
  const params = useParams();

  // Get version from URL path parameter instead of query parameter
  const versionIdParam = params.versionId ? parseInt(params.versionId) : null;

  // Show loading if we don't have required data yet
  if (!appId) {
    return <Loading />;
  }

  const handleSubmit = async (data: any) => {
    try {
      // Use version from URL path if available, otherwise get from form data
      const version = versionIdParam || data.version;
      const { changes } = data;

      if (!version) {
        alert('Error: No version specified');
        return;
      }

      const result = await editAppVersion({
        appId: parseInt(appId),
        version,
        versionChanges: { changes },
      }).unwrap();
      alert(`Success! Version ${version} updated: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  // If we have a version from URL path, only show the changes field
  if (versionIdParam) {
    const ChangesOnlySchema = z.object({
      changes: z.string().min(1, 'Changes description is required').openapi({
        description: 'Updated changelog information',
        example: 'Fixed bugs and improved performance',
      }),
    });

    return (
      <div>
        <FormRenderer
          schema={ChangesOnlySchema}
          onSubmit={handleSubmit}
          title={`Edit App Version ${versionIdParam}`}
          description="Update the changelog for this specific app version"
          isLoading={isLoading}
          hideHeader={hideHeader}
        />
      </div>
    );
  }

  // Original form with version selector for backward compatibility
  return (
    <FormRenderer
      schema={VersionChanges}
      onSubmit={handleSubmit}
      title="Edit App Version"
      description="Update changes for a specific app version"
      isLoading={isLoading}
      hideHeader={hideHeader}
    />
  );
}

export function GetAllAppsForm() {
  const [listApps, { isLoading }] = vincentApiClient.useLazyListAppsQuery();

  const handleSubmit = async () => {
    try {
      const result = await listApps().unwrap();
      alert(`Success! Retrieved ${result.length} apps: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  // Create a minimal schema for the form (no fields needed)
  const EmptySchema = z.object({});

  return (
    <FormRenderer
      schema={EmptySchema}
      onSubmit={handleSubmit}
      title="Get All Apps"
      description="Fetch all applications from the system"
      isLoading={isLoading}
    />
  );
}
