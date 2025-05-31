import { useState } from 'react';
import {
  BaseForm,
  TextField,
  TextAreaField,
  SelectField,
  ArrayField,
  useForm,
  useAsyncForm,
  EntitySelector,
  EntityDataShape,
  schemas,
  VALIDATION_MESSAGES,
} from '../generic';

// Type definitions using the new consolidated types
interface ICreateAppDef {
  name: string;
  description: string;
  contactEmail: string;
  appUserUrl: string;
  logo: string;
  redirectUris: string[];
  deploymentStatus: 'dev' | 'test' | 'prod';
}

type IAppDef = EntityDataShape<'app'>;

const mockGetToolVersion = async (): Promise<{ ipfsCid: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  // Return mock version with ipfsCid
  return {
    ipfsCid: `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
  };
};

const mockGetPolicyVersion = async (): Promise<{ ipfsCid: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  // Return mock version with ipfsCid
  return {
    ipfsCid: `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
  };
};

// Mock Create App API - now expects ipfsCids instead of package names
const mockCreateApp = async (
  data: ICreateAppDef & { toolIpfsCids: string[]; policyIpfsCids: string[] },
): Promise<ICreateAppResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return {
    app: {
      appId: Math.floor(Math.random() * 1000),
      name: data.name,
      description: data.description,
      contactEmail: data.contactEmail,
      appUserUrl: data.appUserUrl,
      logo: data.logo,
      redirectUris: data.redirectUris,
      deploymentStatus: data.deploymentStatus,
      activeVersion: 1,
      lastUpdated: new Date().toISOString(),
      managerAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
    },
    toolIpfsCids: data.toolIpfsCids,
    policyIpfsCids: data.policyIpfsCids,
  };
};

// Updated response interface to include ipfsCids
interface ICreateAppResponse {
  app: IAppDef;
  toolIpfsCids: string[];
  policyIpfsCids: string[];
}

export function CreateAppForm() {
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);

  const form = useForm<ICreateAppDef>(
    {
      name: '',
      description: '',
      contactEmail: '',
      appUserUrl: '',
      logo: '',
      redirectUris: [''],
      deploymentStatus: 'dev',
    },
    {
      name: schemas.minLength(3, VALIDATION_MESSAGES.MIN_LENGTH(3)),
      description: schemas.minLength(10, VALIDATION_MESSAGES.MIN_LENGTH(10)),
      contactEmail: schemas.email(),
      appUserUrl: schemas.url(),
      logo: {
        custom: (value: string | string[]) => {
          if (
            !value ||
            (typeof value === 'string' && value.trim() === '') ||
            Array.isArray(value)
          ) {
            return undefined; // Optional field or invalid type
          }

          const logoString = value as string;

          // Accept both raw base64 and data URI formats
          const isDataURI = logoString.startsWith('data:image/');
          const isRawBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(logoString);

          if (!isDataURI && !isRawBase64) {
            return 'Logo must be a valid base64 string or data URI';
          }

          return undefined;
        },
      },
      redirectUris: schemas.arrayOfStrings('At least one redirect URI is required'),
      deploymentStatus: schemas.required('Deployment status is required'),
    },
  );

  const asyncForm = useAsyncForm(mockCreateApp);

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
      values.name.trim().length >= 3 &&
      values.description.trim().length >= 10 &&
      values.contactEmail.trim() !== '' &&
      values.appUserUrl.trim() !== '' &&
      values.redirectUris.length > 0 &&
      values.redirectUris.every((uri) => uri.trim() !== '') &&
      selectedTools.length > 0
    );
  };

  const isValid = isFormComplete();

  // Extract error and success messages from result
  const error = asyncForm.error || undefined;
  const success =
    asyncForm.result && !asyncForm.error && 'app' in asyncForm.result
      ? `App "${asyncForm.result.app.name}" created successfully!`
      : undefined;

  return (
    <BaseForm
      title="Create App"
      description="Create a new blockchain application with tools and policies selection"
      onSubmit={handleSubmit}
      submitText="Create App"
      isLoading={asyncForm.isLoading}
      isValid={isValid}
      error={error}
      success={success}
    >
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="App Name"
          id="app-name"
          value={form.values.name}
          onChange={(value) => form.setValue('name', value)}
          onBlur={() => form.setFieldTouched('name')}
          placeholder="My App"
          required
          error={form.touched.name ? form.errors.name : undefined}
        />

        <TextField
          label="Contact Email"
          id="contact-email"
          type="email"
          value={form.values.contactEmail}
          onChange={(value) => form.setValue('contactEmail', value)}
          onBlur={() => form.setFieldTouched('contactEmail')}
          placeholder="contact@example.com"
          required
          error={form.touched.contactEmail ? form.errors.contactEmail : undefined}
        />
      </div>

      <TextAreaField
        label="Description"
        id="description"
        value={form.values.description}
        onChange={(value) => form.setValue('description', value)}
        onBlur={() => form.setFieldTouched('description')}
        placeholder="App description"
        required
        rows={3}
        error={form.touched.description ? form.errors.description : undefined}
      />

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="App User URL"
          id="app-url"
          type="url"
          value={form.values.appUserUrl}
          onChange={(value) => form.setValue('appUserUrl', value)}
          onBlur={() => form.setFieldTouched('appUserUrl')}
          placeholder="https://myapp.com"
          required
          error={form.touched.appUserUrl ? form.errors.appUserUrl : undefined}
        />

        <SelectField
          label="Deployment Status"
          id="deployment-status"
          value={form.values.deploymentStatus}
          onChange={(value) => form.setValue('deploymentStatus', value as 'dev' | 'test' | 'prod')}
          onBlur={() => form.setFieldTouched('deploymentStatus')}
          placeholder="Select status"
          options={[
            { value: 'dev', label: 'Development' },
            { value: 'test', label: 'Test' },
            { value: 'prod', label: 'Production' },
          ]}
          required
          error={form.touched.deploymentStatus ? form.errors.deploymentStatus : undefined}
        />
      </div>

      <TextField
        label="Logo (Base64 or Data URI)"
        id="logo"
        value={form.values.logo}
        onChange={(value) => form.setValue('logo', value)}
        onBlur={() => form.setFieldTouched('logo')}
        placeholder="data:image/jpeg;base64,... or raw base64 string"
        error={form.touched.logo ? form.errors.logo : undefined}
      />

      <ArrayField
        label="Redirect URIs"
        values={form.values.redirectUris}
        onChange={(uris) => form.setValue('redirectUris', uris)}
        placeholder="https://example.com/callback"
        required
        addButtonText="Add Redirect URI"
        removeButtonText="Remove"
        error={form.touched.redirectUris ? form.errors.redirectUris : undefined}
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
