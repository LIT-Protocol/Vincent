import { useState } from 'react';
import { BaseForm } from './BaseForm';
import { TextField, TextAreaField, SelectField, ArrayField } from './FormField';
import { ENTITY_CONFIGS, validateEntityId } from './entityConfigs';
import { EntityAPIService } from './mockDataService';
import { useAsyncForm, useForm } from './hooks';
import { schemas, VALIDATION_MESSAGES } from './validation';
import { EntityType } from './types';

// Type definitions for form data
interface AppFormData {
  appId: string;
  name: string;
  description: string;
  contactEmail: string;
  appUserUrl: string;
  redirectUris: string[];
  deploymentStatus: 'dev' | 'test' | 'prod';
}

interface ResourceFormData {
  packageName: string;
  title: string;
  description: string;
  activeVersion: string;
}

// Validation rules using schemas and VALIDATION_MESSAGES
const VALIDATION_RULES = {
  app: {
    get: {
      appId: schemas.appId(),
    },
    update: {
      appId: schemas.appId(),
      name: schemas.minLength(3, VALIDATION_MESSAGES.MIN_LENGTH(3)),
      description: schemas.minLength(10, VALIDATION_MESSAGES.MIN_LENGTH(10)),
      contactEmail: schemas.email(),
      appUserUrl: schemas.url(),
      redirectUris: schemas.required('At least one redirect URI is required'),
      deploymentStatus: schemas.required('Deployment status is required'),
    },
    delete: {
      appId: schemas.appId(),
    },
  },
  resource: {
    get: {
      packageName: schemas.packageName(),
    },
    update: {
      packageName: schemas.packageName(),
      title: schemas.minLength(3, VALIDATION_MESSAGES.MIN_LENGTH(3)),
      description: schemas.minLength(10, VALIDATION_MESSAGES.MIN_LENGTH(10)),
      activeVersion: schemas.version(),
    },
    create: {
      packageName: schemas.packageName(),
      title: schemas.minLength(3, VALIDATION_MESSAGES.MIN_LENGTH(3)),
      description: schemas.minLength(10, VALIDATION_MESSAGES.MIN_LENGTH(10)),
    },
    ownerChange: {
      packageName: schemas.packageName(),
      authorWalletAddress: schemas.walletAddress(),
    },
  },
  appVersion: {
    get: {
      appId: schemas.appId(),
      version: schemas.numeric('Version must be a number'),
    },
    edit: {
      appId: schemas.appId(),
      version: schemas.numeric('Version must be a number'),
      changes: schemas.minLength(10, VALIDATION_MESSAGES.MIN_LENGTH(10)),
    },
  },
  resourceVersion: {
    get: {
      packageName: schemas.packageName(),
      version: schemas.version(),
    },
    edit: {
      packageName: schemas.packageName(),
      version: schemas.version(),
      changes: schemas.minLength(10, VALIDATION_MESSAGES.MIN_LENGTH(10)),
    },
  },
  createVersion: {
    packageName: schemas.packageName(),
    changes: schemas.minLength(10, VALIDATION_MESSAGES.MIN_LENGTH(10)),
  },
};

// Custom hook for entity operations
function useEntityOperation<T extends EntityType>(
  entityType: T,
  operation: keyof (typeof ENTITY_CONFIGS)[EntityType]['operations'],
): {
  submit: (data?: any) => Promise<any>;
  isLoading: boolean;
  result: any | Error | null;
  clearResult: () => void;
} {
  const apiService = new EntityAPIService(entityType);

  const asyncForm = useAsyncForm(async (data?: any) => {
    switch (operation) {
      case 'get':
        return apiService.get(data);
      case 'update':
        return apiService.update(data);
      case 'delete':
        return apiService.delete(data);
      case 'create':
        return apiService.create(data);
      case 'changeOwner':
        return apiService.changeOwner(data);
      case 'getAll':
        return apiService.getAll();
      case 'getVersions':
        return apiService.getVersions(data);
      case 'getVersion':
        return apiService.getVersion(data);
      case 'editVersion':
        return apiService.editVersion(data);
      case 'createVersion':
        return apiService.createVersion(data);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  });

  return asyncForm;
}

function createFieldProps<T extends Record<string, any>>(
  form: ReturnType<typeof useForm<T>>,
  fieldName: keyof T,
) {
  return {
    value: form.values[fieldName] as string,
    onChange: (value: any) => form.setValue(fieldName, value),
    onBlur: () => form.setFieldTouched(fieldName),
    error: form.touched[fieldName] ? form.errors[fieldName] : undefined,
    required: true,
  };
}

interface EntityFormWrapperProps {
  config: (typeof ENTITY_CONFIGS)[keyof typeof ENTITY_CONFIGS];
  operation: string;
  form?: any;
  asyncForm: any;
  children: React.ReactNode;
  isValid?: boolean;
  successMessage?: string;
  onSubmit: () => void | Promise<void>;
}

function EntityFormWrapper({
  config,
  operation,
  form,
  asyncForm,
  children,
  isValid = true,
  successMessage,
  onSubmit,
}: EntityFormWrapperProps) {
  const titles: Record<string, string> = {
    get: `Get ${config.displayName}`,
    update: `Edit ${config.displayName}`,
    delete: `Delete ${config.displayName}`,
    create: `Create ${config.displayName}`,
    changeOwner: `Change ${config.displayName} Owner`,
    getAll: `Get All ${config.displayName}s`,
    getVersions: `Get ${config.displayName} Versions`,
    getVersion: `Get ${config.displayName} Version`,
    editVersion: `Edit ${config.displayName} Version`,
    createVersion: `Create ${config.displayName} Version`,
  };

  const descriptions: Record<string, string> = {
    get: `Fetch a ${config.name} by its ${config.idLabel.toLowerCase()}`,
    update: `Update an existing ${config.name === 'app' ? 'application' : config.name}`,
    delete: `Permanently delete a ${config.name} (use with caution)`,
    create: `Create a new ${config.name} with all required information`,
    changeOwner: `Transfer ownership of a ${config.name} to a new wallet address`,
    getAll: `Fetch all available ${config.name}s in the system`,
    getVersions: `Fetch all versions of a ${config.name} by its ${config.idLabel.toLowerCase()}`,
    getVersion: `Fetch a specific version of ${config.name === 'app' ? 'an' : 'a'} ${config.name}`,
    editVersion: `Update the changes for a specific ${config.name} version`,
    createVersion: `Create a new version of an existing ${config.name} with changes description`,
  };

  const submitTexts: Record<string, string> = {
    get: `Get ${config.displayName}`,
    update: `Update ${config.displayName}`,
    delete: `Delete ${config.displayName}`,
    create: `Create ${config.displayName}`,
    changeOwner: 'Transfer Ownership',
    getAll: `Get All ${config.displayName}s`,
    getVersions: `Get ${config.displayName} Versions`,
    getVersion: `Get ${config.displayName} Version`,
    editVersion: `Update ${config.displayName} Version`,
    createVersion: `Create ${config.displayName} Version`,
  };

  // Extract error and success messages directly
  const error =
    asyncForm.result && 'error' in asyncForm.result ? asyncForm.result.error : undefined;
  const success =
    asyncForm.result && !('error' in asyncForm.result)
      ? operation === 'delete'
        ? asyncForm.result?.message
        : successMessage || `${config.displayName} ${operation}d successfully!`
      : undefined;

  return (
    <BaseForm
      title={titles[operation]}
      description={descriptions[operation]}
      onSubmit={onSubmit}
      submitText={submitTexts[operation]}
      isLoading={asyncForm.isLoading}
      isValid={form ? form.isValid : isValid}
      error={error}
      success={success}
    >
      {children}

      {/* Display returned data when available */}
      {asyncForm.result && !('error' in asyncForm.result) && (
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

// Generic Entity Form that handles all operations
export function GenericEntityForm<T>({
  entityType,
  operation,
  onResult,
}: {
  entityType: EntityType;
  operation: keyof (typeof ENTITY_CONFIGS)[EntityType]['operations'];
  onResult?: (result: T) => void;
}) {
  const config = ENTITY_CONFIGS[entityType];

  // Check if operation is allowed for this entity type
  if (!config.operations[operation]) {
    throw new Error(`Operation '${operation}' is not supported for entity type '${entityType}'`);
  }

  // Common state for simple operations
  const [entityId, setEntityId] = useState('');

  // Get appropriate form setup based on operation
  const getFormSetup = () => {
    switch (operation) {
      case 'get':
      case 'delete':
        return { needsForm: false, needsId: true };
      case 'getAll':
        return { needsForm: false, needsId: false };
      case 'update':
        if (entityType === 'app') {
          return {
            needsForm: true,
            initialValues: {
              appId: '',
              name: '',
              description: '',
              contactEmail: '',
              appUserUrl: '',
              redirectUris: [''],
              deploymentStatus: 'dev' as const,
            },
            validationRules: VALIDATION_RULES.app.update,
          };
        } else {
          return {
            needsForm: true,
            initialValues: {
              packageName: '',
              title: '',
              description: '',
              activeVersion: '',
            },
            validationRules: VALIDATION_RULES.resource.update,
          };
        }
      case 'create':
        return {
          needsForm: true,
          initialValues: {
            packageName: '',
            title: '',
            description: '',
          },
          validationRules: VALIDATION_RULES.resource.create,
        };
      case 'changeOwner':
        return {
          needsForm: true,
          initialValues: {
            packageName: '',
            authorWalletAddress: '',
          },
          validationRules: VALIDATION_RULES.resource.ownerChange,
        };
      case 'getVersions':
        return { needsForm: false, needsId: true };
      case 'getVersion':
        if (entityType === 'app') {
          return {
            needsForm: true,
            initialValues: {
              appId: '',
              version: '',
            },
            validationRules: VALIDATION_RULES.appVersion.get,
          };
        } else {
          return {
            needsForm: true,
            initialValues: {
              packageName: '',
              version: '',
            },
            validationRules: VALIDATION_RULES.resourceVersion.get,
          };
        }
      case 'editVersion':
        if (entityType === 'app') {
          return {
            needsForm: true,
            initialValues: {
              appId: '',
              version: '',
              changes: '',
            },
            validationRules: VALIDATION_RULES.appVersion.edit,
          };
        } else {
          return {
            needsForm: true,
            initialValues: {
              packageName: '',
              version: '',
              changes: '',
            },
            validationRules: VALIDATION_RULES.resourceVersion.edit,
          };
        }
      case 'createVersion':
        return {
          needsForm: true,
          initialValues: {
            packageName: '',
            changes: '',
          },
          validationRules: VALIDATION_RULES.createVersion,
        };
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  };

  const formSetup = getFormSetup();
  const form = formSetup.needsForm
    ? useForm(formSetup.initialValues!, formSetup.validationRules!)
    : null;
  const asyncForm = useEntityOperation(entityType, operation as any);

  const handleSubmit = async () => {
    if (formSetup.needsForm && form) {
      if (form.validateAll()) {
        const result = await asyncForm.submit(form.values);
        onResult?.(result as T);
      }
    } else if (formSetup.needsId) {
      if (entityId.trim()) {
        const result = await asyncForm.submit(entityId);
        onResult?.(result as T);
      }
    } else {
      // For operations like getAll that don't need input
      const result = await asyncForm.submit(undefined);
      onResult?.(result as T);
    }
  };

  // Use Zod validation for entity ID instead of regex
  const entityIdError =
    formSetup.needsId && entityId ? validateEntityId(entityType, entityId) : undefined;
  const isValidId = formSetup.needsId ? entityId.trim() !== '' && !entityIdError : true;
  const isValid = form ? form.isValid : isValidId;

  return (
    <EntityFormWrapper
      config={config}
      operation={operation as string}
      form={form}
      asyncForm={asyncForm}
      isValid={isValid}
      onSubmit={handleSubmit}
    >
      {/* Render appropriate fields based on operation */}
      {operation === 'get' || operation === 'delete' ? (
        <TextField
          label={config.idLabel}
          id={`${config.name}-id`}
          type={entityType === 'app' ? 'number' : 'text'}
          value={entityId}
          onChange={setEntityId}
          placeholder={config.idPlaceholder}
          required
          error={entityIdError}
        />
      ) : operation === 'getAll' ? (
        <div className="text-sm text-gray-600 mb-4">
          This form will fetch all {config.name} package names available in the system. No input is
          required.
        </div>
      ) : operation === 'update' && entityType === 'app' && form ? (
        <AppFormFields form={form as any} />
      ) : operation === 'update' && entityType !== 'app' && form ? (
        <ResourceFormFields form={form as any} config={config} mode="edit" />
      ) : operation === 'create' && form ? (
        <ResourceFormFields form={form as any} config={config} mode="create" />
      ) : operation === 'changeOwner' && form ? (
        <ChangeOwnerFields form={form as any} config={config} />
      ) : operation === 'getVersions' ? (
        <TextField
          label={config.idLabel}
          id={`${config.name}-id`}
          type={entityType === 'app' ? 'number' : 'text'}
          value={entityId}
          onChange={setEntityId}
          placeholder={config.idPlaceholder}
          required
          error={entityIdError}
        />
      ) : operation === 'getVersion' && form ? (
        <VersionGetFields form={form as any} config={config} />
      ) : operation === 'editVersion' && form ? (
        <VersionEditFields form={form as any} config={config} />
      ) : operation === 'createVersion' && form ? (
        <CreateVersionFields form={form as any} config={config} />
      ) : null}
    </EntityFormWrapper>
  );
}

// App-specific form fields component
function AppFormFields({ form }: { form: ReturnType<typeof useForm<AppFormData>> }) {
  return (
    <>
      <TextField
        {...createFieldProps(form, 'appId')}
        label="App ID"
        id="app-id"
        type="number"
        placeholder="Enter app ID to edit"
      />

      <div className="grid grid-cols-2 gap-4">
        <TextField
          {...createFieldProps(form, 'name')}
          label="App Name"
          id="app-name"
          placeholder="My App"
        />

        <TextField
          {...createFieldProps(form, 'contactEmail')}
          label="Contact Email"
          id="contact-email"
          type="email"
          placeholder="contact@example.com"
        />
      </div>

      <TextAreaField
        {...createFieldProps(form, 'description')}
        label="Description"
        id="description"
        placeholder="App description"
        rows={3}
      />

      <div className="grid grid-cols-2 gap-4">
        <TextField
          {...createFieldProps(form, 'appUserUrl')}
          label="App User URL"
          id="app-url"
          type="url"
          placeholder="https://myapp.com"
        />

        <SelectField
          {...createFieldProps(form, 'deploymentStatus')}
          label="Deployment Status"
          id="deployment-status"
          placeholder="Select status"
          options={[
            { value: 'dev', label: 'Development' },
            { value: 'test', label: 'Test' },
            { value: 'prod', label: 'Production' },
          ]}
        />
      </div>

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
    </>
  );
}

// Resource (Tool/Policy) form fields component
function ResourceFormFields({
  form,
  config,
  mode = 'edit',
}: {
  form: ReturnType<typeof useForm<ResourceFormData>>;
  config: (typeof ENTITY_CONFIGS)[keyof typeof ENTITY_CONFIGS];
  mode?: 'edit' | 'create';
}) {
  return (
    <>
      <TextField
        {...createFieldProps(form, 'packageName')}
        label="Package Name"
        id="package-name"
        placeholder={config.idPlaceholder}
      />

      <TextField
        {...createFieldProps(form, 'title')}
        label={`${config.displayName} Title`}
        id={`${config.name}-title`}
        placeholder={`The Greatest ${config.displayName}`}
      />

      <TextAreaField
        {...createFieldProps(form, 'description')}
        label="Description"
        id="description"
        placeholder={`This ${config.name} is a foo bar ${config.name}`}
        rows={3}
      />

      {mode === 'edit' && (
        <TextField
          {...createFieldProps(form, 'activeVersion')}
          label="Active Version"
          id="active-version"
          placeholder="1.0.0"
        />
      )}
    </>
  );
}

// Create version fields component (only for tools and policies)
function CreateVersionFields({
  form,
  config,
}: {
  form: ReturnType<typeof useForm<any>>;
  config: (typeof ENTITY_CONFIGS)[keyof typeof ENTITY_CONFIGS];
}) {
  return (
    <>
      <TextField
        {...createFieldProps(form, 'packageName')}
        label="Package Name"
        id="package-name"
        placeholder={config.idPlaceholder}
      />
      <TextAreaField
        {...createFieldProps(form, 'changes')}
        label="Changes"
        id="changes"
        placeholder="Describe what's new in this version"
        rows={3}
      />
    </>
  );
}

function VersionGetFields({
  form,
  config,
}: {
  form: ReturnType<typeof useForm<any>>;
  config: (typeof ENTITY_CONFIGS)[keyof typeof ENTITY_CONFIGS];
}) {
  const isApp = config.name === 'app';

  return (
    <>
      <TextField
        {...createFieldProps(form, isApp ? 'appId' : 'packageName')}
        label={config.idLabel}
        id={`${config.name}-id`}
        type={isApp ? 'number' : 'text'}
        placeholder={config.idPlaceholder}
      />
      <TextField
        {...createFieldProps(form, 'version')}
        label="Version"
        id="version"
        placeholder={isApp ? '1' : '1.0.0'}
      />
    </>
  );
}

// Version edit fields component (for both app and resource types)
function VersionEditFields({
  form,
  config,
}: {
  form: ReturnType<typeof useForm<any>>;
  config: (typeof ENTITY_CONFIGS)[keyof typeof ENTITY_CONFIGS];
}) {
  const isApp = config.name === 'app';

  return (
    <>
      <TextField
        {...createFieldProps(form, isApp ? 'appId' : 'packageName')}
        label={config.idLabel}
        id={`${config.name}-id`}
        type={isApp ? 'number' : 'text'}
        placeholder={config.idPlaceholder}
      />
      <TextField
        {...createFieldProps(form, 'version')}
        label="Version"
        id="version"
        placeholder={isApp ? '1' : '1.0.0'}
      />
      <TextAreaField
        {...createFieldProps(form, 'changes')}
        label="Changes"
        id="changes"
        placeholder="Describe what changed in this version"
        rows={3}
      />
    </>
  );
}

function ChangeOwnerFields({
  form,
  config,
}: {
  form: ReturnType<typeof useForm<any>>;
  config: (typeof ENTITY_CONFIGS)[keyof typeof ENTITY_CONFIGS];
}) {
  return (
    <>
      <TextField
        {...createFieldProps(form, 'packageName')}
        label="Package Name"
        id="package-name"
        placeholder={config.idPlaceholder}
      />
      <TextField
        {...createFieldProps(form, 'authorWalletAddress')}
        label="New Owner Wallet Address"
        id="wallet-address"
        placeholder="0xa723407AdB396a55aCd843D276daEa0d787F8db5"
      />
    </>
  );
}
