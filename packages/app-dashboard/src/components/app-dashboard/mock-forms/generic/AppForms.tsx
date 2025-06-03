import { FormRenderer } from './FormRenderer';
import {
  CreateApp,
  CreateAppVersion,
  GetAppVersion,
  EditApp,
  DeleteApp,
  EditAppVersion,
} from '../schemas/app';
import { vincentApiClient } from '../vincentApiClient';
import { z } from 'zod';
import { useUrlAppId } from '@/hooks/user-dashboard/useUrlAppId';
import { useAccount } from 'wagmi';

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
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  return (
    <div>
      {isConnected && address && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800">Connected Address: {address}</p>
        </div>
      )}
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

export function EditAppForm() {
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
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  return (
    <div>
      {isConnected && address && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800">Connected Address: {address}</p>
        </div>
      )}
      <FormRenderer
        schema={EditApp}
        onSubmit={handleSubmit}
        title="Edit App"
        description="Update an existing application"
        defaultValues={{
          redirectUris: [''],
        }}
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

export function DeleteAppForm() {
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
      isLoading={isLoading}
    />
  );
}

export function CreateAppVersionForm() {
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

export function GetAppVersionForm() {
  const [getAppVersion, { isLoading }] = vincentApiClient.useLazyGetAppVersionQuery();
  const { appId } = useUrlAppId();

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

export function EditAppVersionForm() {
  const [editAppVersion, { isLoading }] = vincentApiClient.useEditAppVersionMutation();
  const { appId } = useUrlAppId();

  const handleSubmit = async (data: any) => {
    if (!appId) {
      alert('Error: No app ID found in URL');
      return;
    }

    try {
      const { version, changes } = data;
      const result = await editAppVersion({
        appId: parseInt(appId),
        version,
        versionChanges: { changes },
      }).unwrap();
      alert(`Success! Version updated: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  return (
    <FormRenderer
      schema={EditAppVersion}
      onSubmit={handleSubmit}
      title="Edit App Version"
      description="Update changes for a specific app version"
      isLoading={isLoading}
    />
  );
}
