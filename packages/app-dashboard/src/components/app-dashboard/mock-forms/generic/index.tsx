import { GenericEntityForm } from './EntityForms';

// App-specific forms
export const GetAppForm = () => <GenericEntityForm entityType="app" operation="get" />;
export const EditAppForm = () => <GenericEntityForm entityType="app" operation="update" />;
export const GetAppVersionsForm = () => (
  <GenericEntityForm entityType="app" operation="getVersions" />
);
export const GetAppVersionForm = () => (
  <GenericEntityForm entityType="app" operation="getVersion" />
);
export const EditAppVersionForm = () => (
  <GenericEntityForm entityType="app" operation="editVersion" />
);

// Policy forms
export const CreatePolicyForm = () => <GenericEntityForm entityType="policy" operation="create" />;
export const GetPolicyForm = () => <GenericEntityForm entityType="policy" operation="get" />;
export const EditPolicyForm = () => <GenericEntityForm entityType="policy" operation="update" />;
export const GetPolicyVersionsForm = () => (
  <GenericEntityForm entityType="policy" operation="getVersions" />
);
export const ChangePolicyOwnerForm = () => (
  <GenericEntityForm entityType="policy" operation="changeOwner" />
);
export const CreatePolicyVersionForm = () => (
  <GenericEntityForm entityType="policy" operation="createVersion" />
);
export const GetPolicyVersionForm = () => (
  <GenericEntityForm entityType="policy" operation="getVersion" />
);
export const EditPolicyVersionForm = () => (
  <GenericEntityForm entityType="policy" operation="editVersion" />
);
export const GetAllPoliciesForm = () => (
  <GenericEntityForm entityType="policy" operation="getAll" />
);

// Tool forms
export const CreateToolForm = () => <GenericEntityForm entityType="tool" operation="create" />;
export const GetToolForm = () => <GenericEntityForm entityType="tool" operation="get" />;
export const EditToolForm = () => <GenericEntityForm entityType="tool" operation="update" />;
export const GetToolVersionsForm = () => (
  <GenericEntityForm entityType="tool" operation="getVersions" />
);
export const ChangeToolOwnerForm = () => (
  <GenericEntityForm entityType="tool" operation="changeOwner" />
);
export const CreateToolVersionForm = () => (
  <GenericEntityForm entityType="tool" operation="createVersion" />
);
export const GetToolVersionForm = () => (
  <GenericEntityForm entityType="tool" operation="getVersion" />
);
export const EditToolVersionForm = () => (
  <GenericEntityForm entityType="tool" operation="editVersion" />
);
export const GetAllToolsForm = () => <GenericEntityForm entityType="tool" operation="getAll" />;

export * from './mockDataService';
export * from './hooks';
export * from './FormField';
export * from './BaseForm';
export * from './EntitySelector';
export * from './EntityForms';
export * from './ApiResponseDisplay';
export * from './entityConfigs';
export * from './types';
export * from './validation';
