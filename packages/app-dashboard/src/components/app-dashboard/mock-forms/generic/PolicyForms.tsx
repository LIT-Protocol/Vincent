import { FormRenderer } from './FormRenderer';
import {
  CreatePolicy,
  EditPolicy,
  CreatePolicyVersion,
  GetPolicy,
  GetPolicyVersions,
  GetPolicyVersion,
} from '../schemas/policy';
import { VersionChanges, ChangeOwner } from '../schemas/base';
import { vincentApiClient } from '../vincentApiClient';
import { z } from 'zod';

export function CreatePolicyForm() {
  const [createPolicy, { isLoading }] = vincentApiClient.useCreatePolicyMutation();

  const handleSubmit = async (data: any) => {
    try {
      const result = await createPolicy({ createPolicyDef: data }).unwrap();
      alert(`Success! Policy created: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  return (
    <FormRenderer
      schema={CreatePolicy}
      onSubmit={handleSubmit}
      title="Create Policy"
      description="Create a new policy"
      isLoading={isLoading}
    />
  );
}

export function EditPolicyForm() {
  const [editPolicy, { isLoading }] = vincentApiClient.useEditPolicyMutation();

  const handleSubmit = async (data: any) => {
    try {
      const { packageName, ...editPolicyData } = data;
      const result = await editPolicy({ packageName, editPolicyDef: editPolicyData }).unwrap();
      alert(`Success! Policy updated: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  return (
    <FormRenderer
      schema={EditPolicy}
      onSubmit={handleSubmit}
      title="Edit Policy"
      description="Update an existing policy"
      isLoading={isLoading}
    />
  );
}

export function CreatePolicyVersionForm() {
  const [createPolicyVersion, { isLoading }] = vincentApiClient.useCreatePolicyVersionMutation();

  const handleSubmit = async (data: any) => {
    try {
      const { packageName, changes } = data;
      const result = await createPolicyVersion({
        packageName,
        versionChanges: { changes },
      }).unwrap();
      alert(`Success! Policy version created: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  return (
    <FormRenderer
      schema={CreatePolicyVersion}
      onSubmit={handleSubmit}
      title="Create Policy Version"
      description="Create a new version of a policy"
      isLoading={isLoading}
    />
  );
}

export function GetPolicyForm() {
  const [getPolicy, { isLoading }] = vincentApiClient.useLazyGetPolicyQuery();

  const handleSubmit = async (data: any) => {
    try {
      const result = await getPolicy({ packageName: data.packageName }).unwrap();
      alert(`Success! Retrieved policy: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  return (
    <FormRenderer
      schema={GetPolicy}
      onSubmit={handleSubmit}
      title="Get Policy"
      description="Fetch a policy by its package name"
      isLoading={isLoading}
    />
  );
}

export function GetAllPoliciesForm() {
  const [listAllPolicies, { isLoading }] = vincentApiClient.useLazyListAllPoliciesQuery();

  const handleSubmit = async () => {
    try {
      const result = await listAllPolicies().unwrap();
      alert(`Success! Retrieved all policies: ${JSON.stringify(result, null, 2)}`);
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
      title="Get All Policies"
      description="Fetch all policies"
      isLoading={isLoading}
    />
  );
}

export function GetPolicyVersionsForm() {
  const [getPolicyVersions, { isLoading }] = vincentApiClient.useLazyGetPolicyVersionsQuery();

  const handleSubmit = async (data: any) => {
    try {
      const result = await getPolicyVersions({ packageName: data.packageName }).unwrap();
      alert(`Success! Retrieved versions: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  return (
    <FormRenderer
      schema={GetPolicyVersions}
      onSubmit={handleSubmit}
      title="Get Policy Versions"
      description="Fetch all versions of a policy"
      isLoading={isLoading}
    />
  );
}

export function ChangePolicyOwnerForm() {
  const [changePolicyOwner, { isLoading }] = vincentApiClient.useChangePolicyOwnerMutation();

  const handleSubmit = async (data: any) => {
    try {
      const { packageName, authorWalletAddress } = data;
      const result = await changePolicyOwner({
        packageName,
        body: { authorWalletAddress },
      }).unwrap();
      alert(`Success! Policy owner changed: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      alert(`Error: ${error?.data?.message || error?.message || 'Unknown error'}`);
    }
  };

  return (
    <FormRenderer
      schema={ChangeOwner}
      onSubmit={handleSubmit}
      title="Change Policy Owner"
      description="Change the owner of a policy"
      isLoading={isLoading}
    />
  );
}

export function GetPolicyVersionForm() {
  const [getPolicyVersion, { isLoading }] = vincentApiClient.useLazyGetPolicyVersionQuery();

  const handleSubmit = async (data: any) => {
    try {
      const result = await getPolicyVersion({
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
      schema={GetPolicyVersion}
      onSubmit={handleSubmit}
      title="Get Policy Version"
      description="Fetch a specific version of a policy"
      isLoading={isLoading}
    />
  );
}

export function EditPolicyVersionForm() {
  const [editPolicyVersion, { isLoading }] = vincentApiClient.useEditPolicyVersionMutation();

  const handleSubmit = async (data: any) => {
    try {
      const { packageName, version, changes } = data;
      const result = await editPolicyVersion({
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
      schema={VersionChanges}
      onSubmit={handleSubmit}
      title="Edit Policy Version"
      description="Update a specific version of a policy"
      isLoading={isLoading}
    />
  );
}
