import { useState } from 'react';
import {
  BaseForm,
  TextField,
  TextAreaField,
  EntitySelector,
  useForm,
  useAsyncForm,
  schemas,
  VALIDATION_MESSAGES,
} from '../generic';

interface ICreateAppVersionDef {
  appId: string;
  changes: string;
}

interface IAppVersionDef {
  appId: number;
  version: number;
  changes: string;
  createdAt: string;
  isActive: boolean;
}

const mockGetToolVersion = async (): Promise<{ ipfsCid: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return {
    ipfsCid: `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
  };
};

const mockGetPolicyVersion = async (): Promise<{ ipfsCid: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return {
    ipfsCid: `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
  };
};

// Updated response interface to include ipfsCids
interface ICreateAppVersionResponse {
  appVersion: IAppVersionDef;
  toolIpfsCids: string[];
  policyIpfsCids: string[];
}

const mockCreateAppVersion = async (
  data: ICreateAppVersionDef & { toolIpfsCids: string[]; policyIpfsCids: string[] },
): Promise<ICreateAppVersionResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    appVersion: {
      appId: parseInt(data.appId),
      version: 2,
      changes: data.changes,
      createdAt: new Date().toISOString(),
      isActive: false,
    },
    toolIpfsCids: data.toolIpfsCids,
    policyIpfsCids: data.policyIpfsCids,
  };
};

export function CreateAppVersionForm() {
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);

  const form = useForm<ICreateAppVersionDef>(
    {
      appId: '',
      changes: '',
    },
    {
      appId: schemas.appId(),
      changes: schemas.minLength(10, VALIDATION_MESSAGES.MIN_LENGTH(10)),
    },
  );

  const asyncForm = useAsyncForm(mockCreateAppVersion);

  const handleSubmit = async () => {
    if (form.validateAll() && selectedTools.length > 0) {
      try {
        // Fetch tool ipfsCids
        const toolIpfsCids: string[] = [];
        for (const _ of selectedTools) {
          const toolVersion = await mockGetToolVersion();
          toolIpfsCids.push(toolVersion.ipfsCid);
        }

        // Fetch policy ipfsCids
        const policyIpfsCids: string[] = [];
        for (const _ of selectedPolicies) {
          const policyVersion = await mockGetPolicyVersion();
          policyIpfsCids.push(policyVersion.ipfsCid);
        }

        await asyncForm.submit({ ...form.values, toolIpfsCids, policyIpfsCids });
      } catch (error) {
        console.error('Error fetching tool/policy details:', error);
        // Handle error appropriately
      }
    }
  };

  // Check all required fields are filled before enabling submit
  const isFormComplete = () => {
    const { values } = form;
    return (
      values.appId.trim() !== '' && values.changes.trim().length >= 10 && selectedTools.length > 0
    );
  };

  const isValid = isFormComplete();

  // Extract error and success messages from result
  const error = asyncForm.error || undefined;
  const success =
    asyncForm.result && !asyncForm.error && 'appVersion' in asyncForm.result
      ? `App version ${asyncForm.result.appVersion.version} created successfully for App ID ${asyncForm.result.appVersion.appId}!`
      : undefined;

  return (
    <BaseForm
      title="Create App Version"
      description="Create a new version of an existing app with updated tools and policies"
      onSubmit={handleSubmit}
      submitText="Create App Version"
      isLoading={asyncForm.isLoading}
      isValid={isValid}
      error={error}
      success={success}
    >
      <TextField
        label="App ID"
        id="app-id"
        type="number"
        value={form.values.appId}
        onChange={(value) => form.setValue('appId', value)}
        onBlur={() => form.setFieldTouched('appId')}
        placeholder="Enter app ID"
        required
        error={form.touched.appId ? form.errors.appId : undefined}
      />

      <TextAreaField
        label="Changes"
        id="changes"
        value={form.values.changes}
        onChange={(value) => form.setValue('changes', value)}
        onBlur={() => form.setFieldTouched('changes')}
        placeholder="Describe what changed in this version"
        required
        rows={4}
        error={form.touched.changes ? form.errors.changes : undefined}
      />

      <EntitySelector
        entityType="tool"
        selectedEntities={selectedTools}
        onChange={setSelectedTools}
        error={selectedTools.length === 0 ? 'At least one tool must be selected' : undefined}
      />

      <EntitySelector
        entityType="policy"
        selectedEntities={selectedPolicies}
        onChange={setSelectedPolicies}
      />

      {/* Display returned data when available */}
      {asyncForm.result && !asyncForm.error && (
        <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Response Data:</h4>
          <pre className="text-sm text-blue-800 whitespace-pre-wrap overflow-auto max-h-64">
            {JSON.stringify(asyncForm.result, null, 2)}
          </pre>
        </div>
      )}
    </BaseForm>
  );
}
