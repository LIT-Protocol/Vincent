import { FormRenderer } from './FormRenderer';
import {
  CreateTool,
  EditTool,
  CreateToolVersion,
  GetTool,
  ChangeToolOwner,
  GetToolVersions,
  EditToolVersion,
  GetToolVersion,
} from '../schemas/tool';
import { vincentApiClient } from '../vincentApiClient';
import { z } from 'zod';
import { StatusMessage } from '@/utils/shared/statusMessage';
import { useState } from 'react';

export function CreateToolForm() {
  const [createTool, { isLoading }] = vincentApiClient.useCreateToolMutation();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (data: any) => {
    setError(null);
    setResult(null);

    try {
      const response = await createTool({
        createTool: data,
      }).unwrap();

      setResult(response);
      // Refresh the page after successful submission
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      setError(error?.data?.message || error?.message || 'Failed to create tool');
    }
  };

  if (error) {
    return <StatusMessage message={error} type="error" />;
  }

  if (result) {
    return <StatusMessage message="Tool created successfully! Refreshing page..." type="success" />;
  }

  return (
    <FormRenderer
      schema={CreateTool}
      onSubmit={handleSubmit}
      title="Create Tool"
      description="Create a new tool for blockchain applications"
      isLoading={isLoading}
    />
  );
}

export function EditToolForm() {
  const [editTool, { isLoading }] = vincentApiClient.useEditToolMutation();

  const handleSubmit = async (data: any) => {
    try {
      const { packageName, ...editToolData } = data;
      const result = await editTool({ packageName, editTool: editToolData }).unwrap();
      alert(`Success! Tool updated: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  return (
    <FormRenderer
      schema={EditTool}
      onSubmit={handleSubmit}
      title="Edit Tool"
      description="Update an existing tool"
      isLoading={isLoading}
    />
  );
}

export function CreateToolVersionForm() {
  const [createToolVersion, { isLoading }] = vincentApiClient.useCreateToolVersionMutation();

  const handleSubmit = async (data: any) => {
    try {
      const { packageName, changes } = data;
      const result = await createToolVersion({
        packageName,
        versionChanges: { changes },
      }).unwrap();
      alert(`Success! Tool version created: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  return (
    <FormRenderer
      schema={CreateToolVersion}
      onSubmit={handleSubmit}
      title="Create Tool Version"
      description="Create a new version of a tool"
      isLoading={isLoading}
    />
  );
}

export function GetToolForm() {
  const [getTool, { isLoading }] = vincentApiClient.useLazyGetToolQuery();

  const handleSubmit = async (data: any) => {
    try {
      const result = await getTool({ packageName: data.packageName }).unwrap();
      alert(`Success! Retrieved tool: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  return (
    <FormRenderer
      schema={GetTool}
      onSubmit={handleSubmit}
      title="Get Tool"
      description="Fetch a tool by its package name"
      isLoading={isLoading}
    />
  );
}

export function GetAllToolsForm() {
  const [listAllTools, { isLoading }] = vincentApiClient.useLazyListAllToolsQuery();

  const handleSubmit = async () => {
    try {
      const result = await listAllTools().unwrap();
      alert(`Success! Retrieved all tools: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  // Empty schema since no parameters needed
  const EmptySchema = z.object({});

  return (
    <FormRenderer
      schema={EmptySchema}
      onSubmit={handleSubmit}
      title="Get All Tools"
      description="Fetch all tools"
      isLoading={isLoading}
    />
  );
}

export function GetToolVersionsForm() {
  const [getToolVersions, { isLoading }] = vincentApiClient.useLazyGetToolVersionsQuery();

  const handleSubmit = async (data: any) => {
    try {
      const result = await getToolVersions({ packageName: data.packageName }).unwrap();
      alert(`Success! Retrieved versions: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  return (
    <FormRenderer
      schema={GetToolVersions}
      onSubmit={handleSubmit}
      title="Get Tool Versions"
      description="Fetch all versions of a tool"
      isLoading={isLoading}
    />
  );
}

export function ChangeToolOwnerForm() {
  const [changeToolOwner, { isLoading }] = vincentApiClient.useChangeToolOwnerMutation();

  const handleSubmit = async (data: any) => {
    try {
      const { packageName, authorWalletAddress } = data;
      const result = await changeToolOwner({
        packageName,
        body: { authorWalletAddress },
      }).unwrap();
      alert(`Success! Tool owner changed: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  return (
    <FormRenderer
      schema={ChangeToolOwner}
      onSubmit={handleSubmit}
      title="Change Tool Owner"
      description="Change the owner of a tool"
      isLoading={isLoading}
    />
  );
}

export function GetToolVersionForm() {
  const [getToolVersion, { isLoading }] = vincentApiClient.useLazyGetToolVersionQuery();

  const handleSubmit = async (data: any) => {
    try {
      const result = await getToolVersion({
        packageName: data.packageName,
        version: data.version,
      }).unwrap();
      alert(`Success! Retrieved version: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  return (
    <FormRenderer
      schema={GetToolVersion}
      onSubmit={handleSubmit}
      title="Get Tool Version"
      description="Fetch a specific version of a tool"
      isLoading={isLoading}
    />
  );
}

export function EditToolVersionForm() {
  const [editToolVersion, { isLoading }] = vincentApiClient.useEditToolVersionMutation();

  const handleSubmit = async (data: any) => {
    try {
      const { packageName, version, changes } = data;
      const result = await editToolVersion({
        packageName,
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
      schema={EditToolVersion}
      onSubmit={handleSubmit}
      title="Edit Tool Version"
      description="Update a specific version of a tool"
      isLoading={isLoading}
    />
  );
}
