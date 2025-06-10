import { baseVincentRtkApi as api } from '../lib/baseVincentRtkApi';
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    createApp: build.mutation<CreateAppApiResponse, CreateAppApiArg>({
      query: (queryArg) => ({ url: `/app`, method: 'POST', body: queryArg.createApp }),
    }),
    getApp: build.query<GetAppApiResponse, GetAppApiArg>({
      query: (queryArg) => ({ url: `/app/${queryArg.appId}` }),
    }),
    editApp: build.mutation<EditAppApiResponse, EditAppApiArg>({
      query: (queryArg) => ({
        url: `/app/${queryArg.appId}`,
        method: 'PUT',
        body: queryArg.createApp,
      }),
    }),
    deleteApp: build.mutation<DeleteAppApiResponse, DeleteAppApiArg>({
      query: (queryArg) => ({ url: `/app/${queryArg.appId}`, method: 'DELETE' }),
    }),
    getAppVersions: build.query<GetAppVersionsApiResponse, GetAppVersionsApiArg>({
      query: (queryArg) => ({ url: `/app/${queryArg.appId}/versions` }),
    }),
    createAppVersion: build.mutation<CreateAppVersionApiResponse, CreateAppVersionApiArg>({
      query: (queryArg) => ({
        url: `/app/${queryArg.appId}/version`,
        method: 'POST',
        body: queryArg.createAppVersion,
      }),
    }),
    getAppVersion: build.query<GetAppVersionApiResponse, GetAppVersionApiArg>({
      query: (queryArg) => ({ url: `/app/${queryArg.appId}/version/${queryArg.version}` }),
    }),
    editAppVersion: build.mutation<EditAppVersionApiResponse, EditAppVersionApiArg>({
      query: (queryArg) => ({
        url: `/app/${queryArg.appId}/version/${queryArg.version}`,
        method: 'PUT',
        body: queryArg.versionChanges,
      }),
    }),
    toggleAppVersion: build.mutation<ToggleAppVersionApiResponse, ToggleAppVersionApiArg>({
      query: (queryArg) => ({
        url: `/app/${queryArg.appId}/version/${queryArg.version}/toggle`,
        method: 'POST',
      }),
    }),
    listAllTools: build.query<ListAllToolsApiResponse, ListAllToolsApiArg>({
      query: () => ({ url: `/tools` }),
    }),
    createTool: build.mutation<CreateToolApiResponse, CreateToolApiArg>({
      query: (queryArg) => ({ url: `/tool`, method: 'POST', body: queryArg.createTool }),
    }),
    getTool: build.query<GetToolApiResponse, GetToolApiArg>({
      query: (queryArg) => ({ url: `/tool/${queryArg.packageName}` }),
    }),
    editTool: build.mutation<EditToolApiResponse, EditToolApiArg>({
      query: (queryArg) => ({
        url: `/tool/${queryArg.packageName}`,
        method: 'PUT',
        body: queryArg.editTool,
      }),
    }),
    getToolVersions: build.query<GetToolVersionsApiResponse, GetToolVersionsApiArg>({
      query: (queryArg) => ({ url: `/tool/${queryArg.packageName}/versions` }),
    }),
    changeToolOwner: build.mutation<ChangeToolOwnerApiResponse, ChangeToolOwnerApiArg>({
      query: (queryArg) => ({
        url: `/tool/${queryArg.packageName}/owner`,
        method: 'PUT',
        body: queryArg.body,
      }),
    }),
    createToolVersion: build.mutation<CreateToolVersionApiResponse, CreateToolVersionApiArg>({
      query: (queryArg) => ({
        url: `/tool/${queryArg.packageName}/version`,
        method: 'POST',
        body: queryArg.versionChanges,
      }),
    }),
    getToolVersion: build.query<GetToolVersionApiResponse, GetToolVersionApiArg>({
      query: (queryArg) => ({ url: `/tool/${queryArg.packageName}/version/${queryArg.version}` }),
    }),
    editToolVersion: build.mutation<EditToolVersionApiResponse, EditToolVersionApiArg>({
      query: (queryArg) => ({
        url: `/tool/${queryArg.packageName}/version/${queryArg.version}`,
        method: 'PUT',
        body: queryArg.versionChanges,
      }),
    }),
    listAllPolicies: build.query<ListAllPoliciesApiResponse, ListAllPoliciesApiArg>({
      query: () => ({ url: `/policies` }),
    }),
    createPolicy: build.mutation<CreatePolicyApiResponse, CreatePolicyApiArg>({
      query: (queryArg) => ({ url: `/policy`, method: 'POST', body: queryArg.createPolicyDef }),
    }),
    getPolicy: build.query<GetPolicyApiResponse, GetPolicyApiArg>({
      query: (queryArg) => ({ url: `/policy/${queryArg.packageName}` }),
    }),
    editPolicy: build.mutation<EditPolicyApiResponse, EditPolicyApiArg>({
      query: (queryArg) => ({
        url: `/policy/${queryArg.packageName}`,
        method: 'PUT',
        body: queryArg.editPolicyDef,
      }),
    }),
    createPolicyVersion: build.mutation<CreatePolicyVersionApiResponse, CreatePolicyVersionApiArg>({
      query: (queryArg) => ({
        url: `/policy/${queryArg.packageName}/version`,
        method: 'POST',
        body: queryArg.versionChanges,
      }),
    }),
    getPolicyVersion: build.query<GetPolicyVersionApiResponse, GetPolicyVersionApiArg>({
      query: (queryArg) => ({ url: `/policy/${queryArg.packageName}/version/${queryArg.version}` }),
    }),
    editPolicyVersion: build.mutation<EditPolicyVersionApiResponse, EditPolicyVersionApiArg>({
      query: (queryArg) => ({
        url: `/policy/${queryArg.packageName}/version/${queryArg.version}`,
        method: 'PUT',
        body: queryArg.versionChanges,
      }),
    }),
    getPolicyVersions: build.query<GetPolicyVersionsApiResponse, GetPolicyVersionsApiArg>({
      query: (queryArg) => ({ url: `/policy/${queryArg.packageName}/versions` }),
    }),
    changePolicyOwner: build.mutation<ChangePolicyOwnerApiResponse, ChangePolicyOwnerApiArg>({
      query: (queryArg) => ({
        url: `/policy/${queryArg.packageName}/owner`,
        method: 'PUT',
        body: queryArg.body,
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as vincentApiClient };
export type CreateAppApiResponse = /** status 200 Successful operation */ AppDefRead;
export type CreateAppApiArg = {
  /** Developer-defined application information */
  createApp: CreateApp;
};
export type GetAppApiResponse = /** status 200 Successful operation */ AppDefRead;
export type GetAppApiArg = {
  /** ID of the application to retrieve */
  appId: number;
};
export type EditAppApiResponse = /** status 200 Successful operation */ AppDefRead;
export type EditAppApiArg = {
  /** ID of the application to edit */
  appId: number;
  /** Developer-defined updated application details */
  createApp: CreateApp;
};
export type DeleteAppApiResponse =
  /** status 200 OK - Resource successfully deleted */ DeleteResponse;
export type DeleteAppApiArg = {
  /** ID of the application to delete */
  appId: number;
};
export type GetAppVersionsApiResponse = /** status 200 Successful operation */ AppVersionsArrayRead;
export type GetAppVersionsApiArg = {
  /** ID of the application whose versions will be fetched */
  appId: number;
};
export type CreateAppVersionApiResponse = /** status 200 Successful operation */ AppVersionDefRead;
export type CreateAppVersionApiArg = {
  /** ID of the application to create a new version for */
  appId: number;
  /** Developer-defined version details */
  createAppVersion: CreateAppVersion;
};
export type GetAppVersionApiResponse =
  /** status 200 Successful operation */ AppVersionWithToolsRead;
export type GetAppVersionApiArg = {
  /** ID of the application to retrieve a version for */
  appId: number;
  /** Version number to retrieve */
  version: number;
};
export type EditAppVersionApiResponse = /** status 200 Successful operation */ AppVersionDefRead;
export type EditAppVersionApiArg = {
  /** ID of the application to edit a version for */
  appId: number;
  /** Version number to edit */
  version: number;
  /** Update version changes field */
  versionChanges: VersionChanges;
};
export type ToggleAppVersionApiResponse = /** status 200 Successful operation */ AppVersionDefRead;
export type ToggleAppVersionApiArg = {
  /** ID of the application to toggle a version for */
  appId: number;
  /** Version number to toggle */
  version: number;
};
export type ListAllToolsApiResponse = /** status 200 Successful operation */ ToolDefRead[];
export type ListAllToolsApiArg = void;
export type CreateToolApiResponse = /** status 200 Successful operation */ ToolDefRead;
export type CreateToolApiArg = {
  /** Developer-defined tool details */
  createTool: CreateTool;
};
export type GetToolApiResponse = /** status 200 Successful operation */ ToolDefRead;
export type GetToolApiArg = {
  /** Package name of the tool to retrieve */
  packageName: string;
};
export type EditToolApiResponse = /** status 200 Successful operation */ ToolDefRead;
export type EditToolApiArg = {
  /** Package name of the tool to edit */
  packageName: string;
  /** Developer-defined updated tool details */
  editTool: EditTool;
};
export type GetToolVersionsApiResponse = /** status 200 Successful operation */ ToolVersionDef[];
export type GetToolVersionsApiArg = {
  /** Package name of the tool to fetch versions for */
  packageName: string;
};
export type ChangeToolOwnerApiResponse = /** status 200 Successful operation */ ToolDefRead;
export type ChangeToolOwnerApiArg = {
  /** Package name of the tool to change the owner of */
  packageName: string;
  /** Developer-defined updated tool details */
  body: {
    /** New author wallet address */
    authorWalletAddress: string;
  };
};
export type CreateToolVersionApiResponse = /** status 200 Successful operation */ ToolVersionDef;
export type CreateToolVersionApiArg = {
  /** Package name of the tool to create a new version for */
  packageName: string;
  /** Developer-defined version details */
  versionChanges: VersionChanges;
};
export type GetToolVersionApiResponse = /** status 200 Successful operation */ ToolVersionDef;
export type GetToolVersionApiArg = {
  /** Package name of the tool to retrieve a version for */
  packageName: string;
  /** Version number to retrieve */
  version: string;
};
export type EditToolVersionApiResponse = /** status 200 Successful operation */ ToolVersionDef;
export type EditToolVersionApiArg = {
  /** Package name of the tool to edit a version for */
  packageName: string;
  /** Version number to edit */
  version: string;
  /** Update version changes field */
  versionChanges: VersionChanges;
};
export type ListAllPoliciesApiResponse = /** status 200 Successful operation */ PolicyDefRead[];
export type ListAllPoliciesApiArg = void;
export type CreatePolicyApiResponse = /** status 200 Successful operation */ PolicyDefRead;
export type CreatePolicyApiArg = {
  /** Developer-defined policy details */
  createPolicyDef: CreatePolicyDef;
};
export type GetPolicyApiResponse = /** status 200 Successful operation */ PolicyDefRead;
export type GetPolicyApiArg = {
  /** Package name of the policy to retrieve */
  packageName: string;
};
export type EditPolicyApiResponse = /** status 200 Successful operation */ PolicyDefRead;
export type EditPolicyApiArg = {
  /** Package name of the policy to edit */
  packageName: string;
  /** Developer-defined updated policy details */
  editPolicyDef: EditPolicyDef;
};
export type CreatePolicyVersionApiResponse =
  /** status 200 Successful operation */ PolicyVersionDefRead;
export type CreatePolicyVersionApiArg = {
  /** Package name of the policy to create a new version for */
  packageName: string;
  /** Developer-defined version details */
  versionChanges: VersionChanges;
};
export type GetPolicyVersionApiResponse =
  /** status 200 Successful operation */ PolicyVersionDefRead;
export type GetPolicyVersionApiArg = {
  /** Package name of the policy to retrieve a version for */
  packageName: string;
  /** Version number to retrieve */
  version: string;
};
export type EditPolicyVersionApiResponse =
  /** status 200 Successful operation */ PolicyVersionDefRead;
export type EditPolicyVersionApiArg = {
  /** Package name of the policy to edit a version for */
  packageName: string;
  /** Version number to edit */
  version: string;
  /** Update version changes field */
  versionChanges: VersionChanges;
};
export type GetPolicyVersionsApiResponse =
  /** status 200 Successful operation */ PolicyVersionsArrayRead;
export type GetPolicyVersionsApiArg = {
  /** Package name of the policy to fetch versions for */
  packageName: string;
};
export type ChangePolicyOwnerApiResponse = /** status 200 Successful operation */ PolicyDefRead;
export type ChangePolicyOwnerApiArg = {
  /** Package name of the policy to change the owner of */
  packageName: string;
  /** Developer-defined updated policy details */
  body: {
    /** New author wallet address */
    authorWalletAddress: string;
  };
};
export type AppDef = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** The name of the application */
  name: string;
  /** Description of the application */
  description: string;
  /** Contact email for the application manager */
  contactEmail: string;
  /** URL of the application for users */
  appUserUrl: string;
  /** Base64 encoded logo image */
  logo: string;
  /** Redirect URIs users can be sent to after signing up for your application (with their JWT token) */
  redirectUris: string[];
  /** Deployment status of the application; dev, test, or prod */
  deploymentStatus: 'dev' | 'test' | 'prod';
  /** Manager wallet address */
  managerAddress: string;
  /** Active version of the application */
  activeVersion: number;
};
export type AppDefRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** The name of the application */
  name: string;
  /** Description of the application */
  description: string;
  /** Contact email for the application manager */
  contactEmail: string;
  /** URL of the application for users */
  appUserUrl: string;
  /** Base64 encoded logo image */
  logo: string;
  /** Redirect URIs users can be sent to after signing up for your application (with their JWT token) */
  redirectUris: string[];
  /** Deployment status of the application; dev, test, or prod */
  deploymentStatus: 'dev' | 'test' | 'prod';
  /** Manager wallet address */
  managerAddress: string;
  /** Application ID */
  appId: number;
  /** Active version of the application */
  activeVersion: number;
};
export type Error = {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
};
export type CreateApp = {
  /** The name of the application */
  name: string;
  /** Description of the application */
  description: string;
  /** Contact email for the application manager */
  contactEmail: string;
  /** URL of the application for users */
  appUserUrl: string;
  /** Base64 encoded logo image */
  logo: string;
  /** Redirect URIs users can be sent to after signing up for your application (with their JWT token) */
  redirectUris: string[];
  /** Deployment status of the application; dev, test, or prod */
  deploymentStatus: 'dev' | 'test' | 'prod';
  /** Manager wallet address */
  managerAddress: string;
};
export type DeleteResponse = {
  /** Success message */
  message: string;
};
export type AppVersionsArray = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Version number */
  version: number;
  /** Whether this version is enabled */
  enabled: boolean;
  /** Changelog information for this version */
  changes: string;
}[];
export type AppVersionsArrayRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Application ID */
  appId: number;
  /** Version number */
  version: number;
  /** Whether this version is enabled */
  enabled: boolean;
  /** Changelog information for this version */
  changes: string;
}[];
export type AppVersionDef = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Version number */
  version: number;
  /** Whether this version is enabled */
  enabled: boolean;
  /** Changelog information for this version */
  changes: string;
};
export type AppVersionDefRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Application ID */
  appId: number;
  /** Version number */
  version: number;
  /** Whether this version is enabled */
  enabled: boolean;
  /** Changelog information for this version */
  changes: string;
};
export type CreateAppVersion = {
  /** List of tool identities to include in this version */
  tools: string[];
  /** Changelog information for this version */
  changes: string;
};
export type AppVersionWithTools = {};
export type AppVersionWithToolsRead = {
  version: {
    /** Document ID */
    _id: string;
    /** Timestamp when this was last modified */
    updatedAt: string;
    /** Timestamp when this was created */
    createdAt: string;
    /** Application ID */
    appId: number;
    /** Version number */
    version: number;
    /** Whether this version is enabled */
    enabled: boolean;
    /** Changelog information for this version */
    changes: string;
  };
  tools: {
    /** Document ID */
    _id: string;
    /** Timestamp when this was last modified */
    updatedAt: string;
    /** Timestamp when this was created */
    createdAt: string;
    /** Application ID */
    appId: number;
    /** Application version */
    appVersion: number;
    /** Tool package name */
    toolPackageName: string;
    /** Tool version */
    toolVersion: string;
    /** Policies that are supported by this tool but are hidden from users of this app specifically */
    hiddenSupportedPolicies: string[];
  }[];
};
export type VersionChanges = {
  /** Updated changelog information */
  changes: string;
};
export type ToolDef = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Tool package name */
  packageName: string;
  /** Tool title */
  title?: string;
  /** Author wallet address */
  authorWalletAddress: string;
  /** Tool description */
  description: string;
  /** Active version of the tool */
  activeVersion: string;
};
export type ToolDefRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Tool package name */
  packageName: string;
  /** Tool title */
  title?: string;
  /** Author wallet address */
  authorWalletAddress: string;
  /** Tool description */
  description: string;
  /** Active version of the tool */
  activeVersion: string;
};
export type CreateTool = {
  /** Tool package name */
  packageName: string;
  /** Tool title */
  title: string;
  /** Tool description */
  description: string;
};
export type EditTool = {
  /** Tool title */
  title: string;
  /** Tool description */
  description: string;
  /** Active version of the tool */
  activeVersion: string;
};
export type ToolVersionDef = {
  /** Tool package name */
  packageName: string;
  /** Tool version */
  version: string;
  /** Changelog information for this version */
  changes: string;
  /** Repository URLs */
  repository: string[];
  /** Keywords for the tool */
  keywords: string[];
  /** Dependencies of the tool */
  dependencies: string[];
  /** Author information */
  author: {
    /** Name of the author */
    name: string;
    /** Email of the author */
    email: string;
    /** URL of the author's website */
    url?: string;
  };
  /** Contributors information */
  contributors: {
    /** Name of the contributor */
    name: string;
    /** Email of the contributor */
    email: string;
    /** URL of the contributor's website */
    url?: string;
  }[];
  /** Tool homepage */
  homepage?: string;
  /** Tool status */
  status: 'invalid' | 'validating' | 'valid' | 'error';
  /** Supported policies */
  supportedPolicies: string[];
  /** IPFS CID */
  ipfsCid: string;
};
export type PolicyDef = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Policy package name */
  packageName: string;
  /** Author wallet address */
  authorWalletAddress: string;
  /** Policy description */
  description: string;
  /** Active version of the policy */
  activeVersion: string;
};
export type PolicyDefRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Policy package name */
  packageName: string;
  /** Author wallet address */
  authorWalletAddress: string;
  /** Policy description */
  description: string;
  /** Active version of the policy */
  activeVersion: string;
};
export type CreatePolicyDef = {
  /** Policy package name */
  packageName: string;
  /** Policy title */
  policyTitle: string;
  /** Policy description */
  description: string;
};
export type EditPolicyDef = {
  /** Policy title */
  policyTitle: string;
  /** Policy description */
  description: string;
  /** Active version of the policy */
  activeVersion: string;
};
export type PolicyVersionDef = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Policy package name */
  packageName: string;
  /** Policy version */
  version: string;
  /** Changelog information for this version */
  changes: string;
  /** Repository URLs */
  repository: string[];
  /** Policy description */
  description: string;
  /** Keywords for the policy */
  keywords: string[];
  /** Dependencies of the policy */
  dependencies: string[];
  /** Author information */
  author: {
    /** Name of the author */
    name: string;
    /** Email of the author */
    email: string;
    /** URL of the author's website */
    url?: string;
  };
  /** Contributors information */
  contributors: {
    /** Name of the contributor */
    name: string;
    /** Email of the contributor */
    email: string;
    /** URL of the contributor's website */
    url?: string;
  }[];
  /** Policy homepage */
  homepage?: string;
  /** Policy status */
  status: 'invalid' | 'validating' | 'valid' | 'error';
  /** IPFS CID */
  ipfsCid: string;
  /** Schema parameters */
  parameters: {
    /** UI Schema for parameter display */
    uiSchema: string;
    /** JSON Schema for parameter validation */
    jsonSchema: string;
  };
};
export type PolicyVersionDefRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Policy package name */
  packageName: string;
  /** Policy version */
  version: string;
  /** Changelog information for this version */
  changes: string;
  /** Repository URLs */
  repository: string[];
  /** Policy description */
  description: string;
  /** Keywords for the policy */
  keywords: string[];
  /** Dependencies of the policy */
  dependencies: string[];
  /** Author information */
  author: {
    /** Name of the author */
    name: string;
    /** Email of the author */
    email: string;
    /** URL of the author's website */
    url?: string;
  };
  /** Contributors information */
  contributors: {
    /** Name of the contributor */
    name: string;
    /** Email of the contributor */
    email: string;
    /** URL of the contributor's website */
    url?: string;
  }[];
  /** Policy homepage */
  homepage?: string;
  /** Policy status */
  status: 'invalid' | 'validating' | 'valid' | 'error';
  /** IPFS CID */
  ipfsCid: string;
  /** Schema parameters */
  parameters: {
    /** UI Schema for parameter display */
    uiSchema: string;
    /** JSON Schema for parameter validation */
    jsonSchema: string;
  };
};
export type PolicyVersionsArray = PolicyVersionDef[];
export type PolicyVersionsArrayRead = PolicyVersionDefRead[];
export const {
  useCreateAppMutation,
  useGetAppQuery,
  useEditAppMutation,
  useDeleteAppMutation,
  useGetAppVersionsQuery,
  useCreateAppVersionMutation,
  useGetAppVersionQuery,
  useEditAppVersionMutation,
  useToggleAppVersionMutation,
  useListAllToolsQuery,
  useCreateToolMutation,
  useGetToolQuery,
  useEditToolMutation,
  useGetToolVersionsQuery,
  useChangeToolOwnerMutation,
  useCreateToolVersionMutation,
  useGetToolVersionQuery,
  useEditToolVersionMutation,
  useListAllPoliciesQuery,
  useCreatePolicyMutation,
  useGetPolicyQuery,
  useEditPolicyMutation,
  useCreatePolicyVersionMutation,
  useGetPolicyVersionQuery,
  useEditPolicyVersionMutation,
  useGetPolicyVersionsQuery,
  useChangePolicyOwnerMutation,
} = injectedRtkApi;
