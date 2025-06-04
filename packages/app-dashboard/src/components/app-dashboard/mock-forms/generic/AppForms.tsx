import { FormRenderer } from './FormRenderer';
import { CreateApp, CreateAppVersion, EditApp, DeleteApp } from '../schemas/app';
import { vincentApiClient } from '../vincentApiClient';
import { z } from 'zod';
import { useUrlAppId } from '@/hooks/user-dashboard/useUrlAppId';
import { useAccount } from 'wagmi';
import { VersionChanges } from '../schemas/base';
import { useParams } from 'react-router-dom';

export function CreateAppForm() {
  const [createApp, { isLoading }] = vincentApiClient.useCreateAppMutation();
  const { address, isConnected } = useAccount();

  const handleSubmit = async (data: any) => {
    if (!isConnected || !address) {
      alert('Error: Wallet not connected');
      return;
    }

    try {
      // Generate appId and prepare app data
      const appId = Math.floor(Math.random() * 10000);
      const appDataForApi = {
        ...data,
        appId,
        managerAddress: address,
      };

      const result = await createApp({
        createApp: appDataForApi,
      }).unwrap();

      alert(`Success! App created: ${JSON.stringify(result, null, 2)}`);

      // Refresh the page after successful submission
      window.location.reload();
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

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

export function EditAppForm({ appData }: { appData?: any }) {
  const [editApp, { isLoading }] = vincentApiClient.useEditAppMutation();
  const { address, isConnected } = useAccount();
  const { appId } = useUrlAppId();

  const handleSubmit = async (data: any) => {
    if (!isConnected || !address) {
      alert('Error: Wallet not connected');
      return;
    }

    if (!appId) {
      alert('Error: No app ID found in URL');
      return;
    }

    try {
      const { ...editAppData } = data;
      const result = await editApp({
        appId: parseInt(appId),
        createApp: { ...editAppData, managerAddress: address },
      }).unwrap();
      alert(`Success! App updated: ${JSON.stringify(result, null, 2)}`);

      // Refresh the page after successful submission
      window.location.reload();
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  return (
    <div>
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
      />
    </div>
  );
}

export function GetAppForm() {
  const [getApp, { isLoading }] = vincentApiClient.useLazyGetAppQuery();
  const { appId } = useUrlAppId();

  const handleSubmit = async () => {
    if (!appId) {
      alert('Error: No app ID found in URL');
      return;
    }

    try {
      const result = await getApp({ appId: parseInt(appId) }).unwrap();
      alert(`Success! Retrieved app: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

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

export function DeleteAppForm({ appData }: { appData?: any }) {
  const [deleteApp, { isLoading }] = vincentApiClient.useDeleteAppMutation();
  const { appId } = useUrlAppId();

  const handleSubmit = async () => {
    if (!appId) {
      alert('Error: No app ID found in URL');
      return;
    }

    try {
      const result = await deleteApp({ appId: parseInt(appId) }).unwrap();
      alert(`Success! App deleted: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  return (
    <FormRenderer
      schema={DeleteApp(appId || '')}
      onSubmit={handleSubmit}
      title="Delete App"
      description="Delete an application"
      appData={appData}
      isLoading={isLoading}
    />
  );
}

export function CreateAppVersionForm({ appData }: { appData?: any }) {
  const [createAppVersion, { isLoading }] = vincentApiClient.useCreateAppVersionMutation();
  const { appId } = useUrlAppId();

  const handleSubmit = async (data: any) => {
    if (!appId) {
      alert('Error: No app ID found in URL');
      return;
    }

    try {
      const result = await createAppVersion({
        appId: parseInt(appId),
        createAppVersion: data,
      }).unwrap();
      alert(`Success! App version created: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

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
    />
  );
}

export function GetAppVersionsForm() {
  const [getAppVersions, { isLoading }] = vincentApiClient.useLazyGetAppVersionsQuery();
  const { appId } = useUrlAppId();

  const handleSubmit = async () => {
    if (!appId) {
      alert('Error: No app ID found in URL');
      return;
    }

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

export function EditAppVersionForm() {
  const [editAppVersion, { isLoading }] = vincentApiClient.useEditAppVersionMutation();
  const { appId } = useUrlAppId();
  const params = useParams();

  // Get version from URL path parameter instead of query parameter
  const versionIdParam = params.versionId ? parseInt(params.versionId) : null;

  const handleSubmit = async (data: any) => {
    if (!appId) {
      alert('Error: No app ID found in URL');
      return;
    }

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
