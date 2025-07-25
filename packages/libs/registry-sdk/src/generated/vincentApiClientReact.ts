import { baseVincentRtkApiReact as api } from '../lib/internal/baseVincentRtkApiReact';
export const addTagTypes = [
  'App',
  'AppVersion',
  'AppVersionTool',
  'Tool',
  'ToolVersion',
  'Policy',
  'PolicyVersion',
] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      listApps: build.query<ListAppsApiResponse, ListAppsApiArg>({
        query: () => ({ url: `/apps` }),
        providesTags: ['App'],
      }),
      createApp: build.mutation<CreateAppApiResponse, CreateAppApiArg>({
        query: (queryArg) => ({ url: `/app`, method: 'POST', body: queryArg.appCreate }),
        invalidatesTags: ['App', 'AppVersion'],
      }),
      getApp: build.query<GetAppApiResponse, GetAppApiArg>({
        query: (queryArg) => ({ url: `/app/${encodeURIComponent(String(queryArg.appId))}` }),
        providesTags: ['App'],
      }),
      editApp: build.mutation<EditAppApiResponse, EditAppApiArg>({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}`,
          method: 'PUT',
          body: queryArg.appEdit,
        }),
        invalidatesTags: ['App'],
      }),
      deleteApp: build.mutation<DeleteAppApiResponse, DeleteAppApiArg>({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['App', 'AppVersion', 'AppVersionTool'],
      }),
      undeleteApp: build.mutation<UndeleteAppApiResponse, UndeleteAppApiArg>({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/undelete`,
          method: 'POST',
        }),
        invalidatesTags: ['App', 'AppVersion', 'AppVersionTool'],
      }),
      getAppVersions: build.query<GetAppVersionsApiResponse, GetAppVersionsApiArg>({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/versions`,
        }),
        providesTags: ['AppVersion'],
      }),
      createAppVersion: build.mutation<CreateAppVersionApiResponse, CreateAppVersionApiArg>({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/version`,
          method: 'POST',
          body: queryArg.appVersionCreate,
        }),
        invalidatesTags: ['AppVersion'],
      }),
      getAppVersion: build.query<GetAppVersionApiResponse, GetAppVersionApiArg>({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.version))}`,
        }),
        providesTags: ['AppVersion'],
      }),
      editAppVersion: build.mutation<EditAppVersionApiResponse, EditAppVersionApiArg>({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.version))}`,
          method: 'PUT',
          body: queryArg.appVersionEdit,
        }),
        invalidatesTags: ['AppVersion'],
      }),
      deleteAppVersion: build.mutation<DeleteAppVersionApiResponse, DeleteAppVersionApiArg>({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.version))}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['AppVersion'],
      }),
      enableAppVersion: build.mutation<EnableAppVersionApiResponse, EnableAppVersionApiArg>({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.version))}/enable`,
          method: 'POST',
        }),
        invalidatesTags: ['AppVersion'],
      }),
      disableAppVersion: build.mutation<DisableAppVersionApiResponse, DisableAppVersionApiArg>({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.version))}/disable`,
          method: 'POST',
        }),
        invalidatesTags: ['AppVersion'],
      }),
      listAppVersionTools: build.query<ListAppVersionToolsApiResponse, ListAppVersionToolsApiArg>({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.version))}/tools`,
        }),
        providesTags: ['AppVersionTool'],
      }),
      createAppVersionTool: build.mutation<
        CreateAppVersionToolApiResponse,
        CreateAppVersionToolApiArg
      >({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.appVersion))}/tool/${encodeURIComponent(String(queryArg.toolPackageName))}`,
          method: 'POST',
          body: queryArg.appVersionToolCreate,
        }),
        invalidatesTags: ['AppVersionTool'],
      }),
      editAppVersionTool: build.mutation<EditAppVersionToolApiResponse, EditAppVersionToolApiArg>({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.appVersion))}/tool/${encodeURIComponent(String(queryArg.toolPackageName))}`,
          method: 'PUT',
          body: queryArg.appVersionToolEdit,
        }),
        invalidatesTags: ['AppVersionTool'],
      }),
      deleteAppVersionTool: build.mutation<
        DeleteAppVersionToolApiResponse,
        DeleteAppVersionToolApiArg
      >({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.appVersion))}/tool/${encodeURIComponent(String(queryArg.toolPackageName))}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['AppVersionTool'],
      }),
      undeleteAppVersion: build.mutation<UndeleteAppVersionApiResponse, UndeleteAppVersionApiArg>({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.version))}/undelete`,
          method: 'POST',
        }),
        invalidatesTags: ['AppVersion'],
      }),
      undeleteAppVersionTool: build.mutation<
        UndeleteAppVersionToolApiResponse,
        UndeleteAppVersionToolApiArg
      >({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.appVersion))}/tool/${encodeURIComponent(String(queryArg.toolPackageName))}/undelete`,
          method: 'POST',
        }),
        invalidatesTags: ['AppVersionTool'],
      }),
      setAppActiveVersion: build.mutation<
        SetAppActiveVersionApiResponse,
        SetAppActiveVersionApiArg
      >({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/setActiveVersion`,
          method: 'POST',
          body: queryArg.appSetActiveVersion,
        }),
        invalidatesTags: ['App'],
      }),
      listAllTools: build.query<ListAllToolsApiResponse, ListAllToolsApiArg>({
        query: () => ({ url: `/tools` }),
        providesTags: ['Tool'],
      }),
      createTool: build.mutation<CreateToolApiResponse, CreateToolApiArg>({
        query: (queryArg) => ({
          url: `/tool/${encodeURIComponent(String(queryArg.packageName))}`,
          method: 'POST',
          body: queryArg.toolCreate,
        }),
        invalidatesTags: ['Tool', 'ToolVersion'],
      }),
      getTool: build.query<GetToolApiResponse, GetToolApiArg>({
        query: (queryArg) => ({ url: `/tool/${encodeURIComponent(String(queryArg.packageName))}` }),
        providesTags: ['Tool'],
      }),
      editTool: build.mutation<EditToolApiResponse, EditToolApiArg>({
        query: (queryArg) => ({
          url: `/tool/${encodeURIComponent(String(queryArg.packageName))}`,
          method: 'PUT',
          body: queryArg.toolEdit,
        }),
        invalidatesTags: ['Tool'],
      }),
      deleteTool: build.mutation<DeleteToolApiResponse, DeleteToolApiArg>({
        query: (queryArg) => ({
          url: `/tool/${encodeURIComponent(String(queryArg.packageName))}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Tool', 'ToolVersion'],
      }),
      getToolVersions: build.query<GetToolVersionsApiResponse, GetToolVersionsApiArg>({
        query: (queryArg) => ({
          url: `/tool/${encodeURIComponent(String(queryArg.packageName))}/versions`,
        }),
        providesTags: ['ToolVersion'],
      }),
      changeToolOwner: build.mutation<ChangeToolOwnerApiResponse, ChangeToolOwnerApiArg>({
        query: (queryArg) => ({
          url: `/tool/${encodeURIComponent(String(queryArg.packageName))}/owner`,
          method: 'PUT',
          body: queryArg.changeOwner,
        }),
        invalidatesTags: ['Tool'],
      }),
      createToolVersion: build.mutation<CreateToolVersionApiResponse, CreateToolVersionApiArg>({
        query: (queryArg) => ({
          url: `/tool/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}`,
          method: 'POST',
          body: queryArg.toolVersionCreate,
        }),
        invalidatesTags: ['ToolVersion'],
      }),
      getToolVersion: build.query<GetToolVersionApiResponse, GetToolVersionApiArg>({
        query: (queryArg) => ({
          url: `/tool/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}`,
        }),
        providesTags: ['ToolVersion'],
      }),
      editToolVersion: build.mutation<EditToolVersionApiResponse, EditToolVersionApiArg>({
        query: (queryArg) => ({
          url: `/tool/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}`,
          method: 'PUT',
          body: queryArg.toolVersionEdit,
        }),
        invalidatesTags: ['ToolVersion'],
      }),
      deleteToolVersion: build.mutation<DeleteToolVersionApiResponse, DeleteToolVersionApiArg>({
        query: (queryArg) => ({
          url: `/tool/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['ToolVersion'],
      }),
      undeleteTool: build.mutation<UndeleteToolApiResponse, UndeleteToolApiArg>({
        query: (queryArg) => ({
          url: `/tool/${encodeURIComponent(String(queryArg.packageName))}/undelete`,
          method: 'POST',
        }),
        invalidatesTags: ['Tool', 'ToolVersion'],
      }),
      undeleteToolVersion: build.mutation<
        UndeleteToolVersionApiResponse,
        UndeleteToolVersionApiArg
      >({
        query: (queryArg) => ({
          url: `/tool/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}/undelete`,
          method: 'POST',
        }),
        invalidatesTags: ['ToolVersion'],
      }),
      listAllPolicies: build.query<ListAllPoliciesApiResponse, ListAllPoliciesApiArg>({
        query: () => ({ url: `/policies` }),
        providesTags: ['Policy'],
      }),
      createPolicy: build.mutation<CreatePolicyApiResponse, CreatePolicyApiArg>({
        query: (queryArg) => ({
          url: `/policy/${encodeURIComponent(String(queryArg.packageName))}`,
          method: 'POST',
          body: queryArg.policyCreate,
        }),
        invalidatesTags: ['Policy', 'PolicyVersion'],
      }),
      getPolicy: build.query<GetPolicyApiResponse, GetPolicyApiArg>({
        query: (queryArg) => ({
          url: `/policy/${encodeURIComponent(String(queryArg.packageName))}`,
        }),
        providesTags: ['Policy'],
      }),
      editPolicy: build.mutation<EditPolicyApiResponse, EditPolicyApiArg>({
        query: (queryArg) => ({
          url: `/policy/${encodeURIComponent(String(queryArg.packageName))}`,
          method: 'PUT',
          body: queryArg.policyEdit,
        }),
        invalidatesTags: ['Policy'],
      }),
      deletePolicy: build.mutation<DeletePolicyApiResponse, DeletePolicyApiArg>({
        query: (queryArg) => ({
          url: `/policy/${encodeURIComponent(String(queryArg.packageName))}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Policy', 'PolicyVersion'],
      }),
      createPolicyVersion: build.mutation<
        CreatePolicyVersionApiResponse,
        CreatePolicyVersionApiArg
      >({
        query: (queryArg) => ({
          url: `/policy/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}`,
          method: 'POST',
          body: queryArg.policyVersionCreate,
        }),
        invalidatesTags: ['PolicyVersion'],
      }),
      getPolicyVersion: build.query<GetPolicyVersionApiResponse, GetPolicyVersionApiArg>({
        query: (queryArg) => ({
          url: `/policy/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}`,
        }),
        providesTags: ['PolicyVersion'],
      }),
      editPolicyVersion: build.mutation<EditPolicyVersionApiResponse, EditPolicyVersionApiArg>({
        query: (queryArg) => ({
          url: `/policy/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}`,
          method: 'PUT',
          body: queryArg.policyVersionEdit,
        }),
        invalidatesTags: ['PolicyVersion'],
      }),
      deletePolicyVersion: build.mutation<
        DeletePolicyVersionApiResponse,
        DeletePolicyVersionApiArg
      >({
        query: (queryArg) => ({
          url: `/policy/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['PolicyVersion'],
      }),
      getPolicyVersions: build.query<GetPolicyVersionsApiResponse, GetPolicyVersionsApiArg>({
        query: (queryArg) => ({
          url: `/policy/${encodeURIComponent(String(queryArg.packageName))}/versions`,
        }),
        providesTags: ['PolicyVersion'],
      }),
      changePolicyOwner: build.mutation<ChangePolicyOwnerApiResponse, ChangePolicyOwnerApiArg>({
        query: (queryArg) => ({
          url: `/policy/${encodeURIComponent(String(queryArg.packageName))}/owner`,
          method: 'PUT',
          body: queryArg.changeOwner,
        }),
        invalidatesTags: ['Policy'],
      }),
      undeletePolicy: build.mutation<UndeletePolicyApiResponse, UndeletePolicyApiArg>({
        query: (queryArg) => ({
          url: `/policy/${encodeURIComponent(String(queryArg.packageName))}/undelete`,
          method: 'POST',
        }),
        invalidatesTags: ['Policy', 'PolicyVersion'],
      }),
      undeletePolicyVersion: build.mutation<
        UndeletePolicyVersionApiResponse,
        UndeletePolicyVersionApiArg
      >({
        query: (queryArg) => ({
          url: `/policy/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}/undelete`,
          method: 'POST',
        }),
        invalidatesTags: ['PolicyVersion'],
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as vincentApiClientReact };
export type ListAppsApiResponse = /** status 200 Successful operation */ AppListRead;
export type ListAppsApiArg = void;
export type CreateAppApiResponse = /** status 200 Successful operation */ AppRead;
export type CreateAppApiArg = {
  /** Developer-defined application information */
  appCreate: AppCreate;
};
export type GetAppApiResponse = /** status 200 Successful operation */ AppRead;
export type GetAppApiArg = {
  /** ID of the target application */
  appId: number;
};
export type EditAppApiResponse = /** status 200 Successful operation */ AppRead;
export type EditAppApiArg = {
  /** ID of the target application */
  appId: number;
  /** Developer-defined updated application details */
  appEdit: AppEdit;
};
export type DeleteAppApiResponse =
  /** status 200 OK - Resource successfully deleted */ GenericResultMessage;
export type DeleteAppApiArg = {
  /** ID of the target application */
  appId: number;
};
export type UndeleteAppApiResponse =
  /** status 200 OK - Resource successfully undeleted */ GenericResultMessage;
export type UndeleteAppApiArg = {
  /** ID of the target application */
  appId: number;
};
export type GetAppVersionsApiResponse = /** status 200 Successful operation */ AppVersionListRead;
export type GetAppVersionsApiArg = {
  /** ID of the target application */
  appId: number;
};
export type CreateAppVersionApiResponse = /** status 200 Successful operation */ AppVersionRead;
export type CreateAppVersionApiArg = {
  /** ID of the target application */
  appId: number;
  /** Developer-defined version details */
  appVersionCreate: AppVersionCreate;
};
export type GetAppVersionApiResponse = /** status 200 Successful operation */ AppVersionRead;
export type GetAppVersionApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  version: number;
};
export type EditAppVersionApiResponse = /** status 200 Successful operation */ AppVersionRead;
export type EditAppVersionApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  version: number;
  /** Update version changes field */
  appVersionEdit: AppVersionEdit;
};
export type DeleteAppVersionApiResponse =
  /** status 200 OK - Resource successfully deleted */ GenericResultMessage;
export type DeleteAppVersionApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  version: number;
};
export type EnableAppVersionApiResponse = /** status 200 Successful operation */ AppVersionRead;
export type EnableAppVersionApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  version: number;
};
export type DisableAppVersionApiResponse = /** status 200 Successful operation */ AppVersionRead;
export type DisableAppVersionApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  version: number;
};
export type ListAppVersionToolsApiResponse =
  /** status 200 Successful operation */ AppVersionToolListRead;
export type ListAppVersionToolsApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  version: number;
};
export type CreateAppVersionToolApiResponse =
  /** status 200 Successful operation */ AppVersionToolRead;
export type CreateAppVersionToolApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  appVersion: number;
  /** The NPM package name */
  toolPackageName: string;
  /** Tool configuration for the application version */
  appVersionToolCreate: AppVersionToolCreate;
};
export type EditAppVersionToolApiResponse =
  /** status 200 Successful operation */ AppVersionToolRead;
export type EditAppVersionToolApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  appVersion: number;
  /** The NPM package name */
  toolPackageName: string;
  /** Updated tool configuration for the application version */
  appVersionToolEdit: AppVersionToolEdit;
};
export type DeleteAppVersionToolApiResponse =
  /** status 200 OK - Resource successfully deleted */ GenericResultMessage;
export type DeleteAppVersionToolApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  appVersion: number;
  /** The NPM package name */
  toolPackageName: string;
};
export type UndeleteAppVersionApiResponse =
  /** status 200 OK - Resource successfully undeleted */ GenericResultMessage;
export type UndeleteAppVersionApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  version: number;
};
export type UndeleteAppVersionToolApiResponse =
  /** status 200 OK - Resource successfully undeleted */ GenericResultMessage;
export type UndeleteAppVersionToolApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  appVersion: number;
  /** The NPM package name */
  toolPackageName: string;
};
export type SetAppActiveVersionApiResponse =
  /** status 200 OK - Active version successfully set */ GenericResultMessage;
export type SetAppActiveVersionApiArg = {
  /** ID of the target application */
  appId: number;
  /** The version to set as active */
  appSetActiveVersion: AppSetActiveVersion;
};
export type ListAllToolsApiResponse = /** status 200 Successful operation */ ToolListRead;
export type ListAllToolsApiArg = void;
export type CreateToolApiResponse = /** status 200 Successful operation */ ToolRead;
export type CreateToolApiArg = {
  /** The NPM package name */
  packageName: string;
  /** Developer-defined tool details */
  toolCreate: ToolCreate;
};
export type GetToolApiResponse = /** status 200 Successful operation */ ToolRead;
export type GetToolApiArg = {
  /** The NPM package name */
  packageName: string;
};
export type EditToolApiResponse = /** status 200 Successful operation */ ToolRead;
export type EditToolApiArg = {
  /** The NPM package name */
  packageName: string;
  /** Developer-defined updated tool details */
  toolEdit: ToolEdit;
};
export type DeleteToolApiResponse = /** status 200 Successful operation */ GenericResultMessage;
export type DeleteToolApiArg = {
  /** The NPM package name */
  packageName: string;
};
export type GetToolVersionsApiResponse = /** status 200 Successful operation */ ToolVersionListRead;
export type GetToolVersionsApiArg = {
  /** The NPM package name */
  packageName: string;
};
export type ChangeToolOwnerApiResponse = /** status 200 Successful operation */ ToolRead;
export type ChangeToolOwnerApiArg = {
  /** The NPM package name */
  packageName: string;
  /** Developer-defined updated tool details */
  changeOwner: ChangeOwner;
};
export type CreateToolVersionApiResponse = /** status 200 Successful operation */ ToolVersionRead;
export type CreateToolVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target tool version */
  version: string;
  /** Developer-defined version details */
  toolVersionCreate: ToolVersionCreate;
};
export type GetToolVersionApiResponse = /** status 200 Successful operation */ ToolVersionRead;
export type GetToolVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target tool version */
  version: string;
};
export type EditToolVersionApiResponse = /** status 200 Successful operation */ ToolVersionRead;
export type EditToolVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target tool version */
  version: string;
  /** Update version changes field */
  toolVersionEdit: ToolVersionEdit;
};
export type DeleteToolVersionApiResponse =
  /** status 200 OK - Resource successfully deleted */ GenericResultMessage;
export type DeleteToolVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target tool version */
  version: string;
};
export type UndeleteToolApiResponse = /** status 200 Successful operation */ GenericResultMessage;
export type UndeleteToolApiArg = {
  /** The NPM package name */
  packageName: string;
};
export type UndeleteToolVersionApiResponse =
  /** status 200 OK - Resource successfully undeleted */ GenericResultMessage;
export type UndeleteToolVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target tool version */
  version: string;
};
export type ListAllPoliciesApiResponse = /** status 200 Successful operation */ PolicyListRead;
export type ListAllPoliciesApiArg = void;
export type CreatePolicyApiResponse = /** status 200 Successful operation */ PolicyRead;
export type CreatePolicyApiArg = {
  /** The NPM package name */
  packageName: string;
  /** Developer-defined policy details */
  policyCreate: PolicyCreate;
};
export type GetPolicyApiResponse = /** status 200 Successful operation */ PolicyRead;
export type GetPolicyApiArg = {
  /** The NPM package name */
  packageName: string;
};
export type EditPolicyApiResponse = /** status 200 Successful operation */ PolicyRead;
export type EditPolicyApiArg = {
  /** The NPM package name */
  packageName: string;
  /** Developer-defined updated policy details */
  policyEdit: PolicyEdit;
};
export type DeletePolicyApiResponse = /** status 200 Successful operation */ GenericResultMessage;
export type DeletePolicyApiArg = {
  /** The NPM package name */
  packageName: string;
};
export type CreatePolicyVersionApiResponse =
  /** status 200 Successful operation */ PolicyVersionRead;
export type CreatePolicyVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target policy version */
  version: string;
  /** Developer-defined version details */
  policyVersionCreate: PolicyVersionCreate;
};
export type GetPolicyVersionApiResponse = /** status 200 Successful operation */ PolicyVersionRead;
export type GetPolicyVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target policy version */
  version: string;
};
export type EditPolicyVersionApiResponse = /** status 200 Successful operation */ PolicyVersionRead;
export type EditPolicyVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target policy version */
  version: string;
  /** Update version changes field */
  policyVersionEdit: PolicyVersionEdit;
};
export type DeletePolicyVersionApiResponse =
  /** status 200 OK - Resource successfully deleted */ GenericResultMessage;
export type DeletePolicyVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target policy version */
  version: string;
};
export type GetPolicyVersionsApiResponse =
  /** status 200 Successful operation */ PolicyVersionListRead;
export type GetPolicyVersionsApiArg = {
  /** The NPM package name */
  packageName: string;
};
export type ChangePolicyOwnerApiResponse = /** status 200 Successful operation */ PolicyRead;
export type ChangePolicyOwnerApiArg = {
  /** The NPM package name */
  packageName: string;
  /** Developer-defined updated policy details */
  changeOwner: ChangeOwner;
};
export type UndeletePolicyApiResponse = /** status 200 Successful operation */ GenericResultMessage;
export type UndeletePolicyApiArg = {
  /** The NPM package name */
  packageName: string;
};
export type UndeletePolicyVersionApiResponse =
  /** status 200 OK - Resource successfully undeleted */ GenericResultMessage;
export type UndeletePolicyVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target policy version */
  version: string;
};
export type App = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Active version of the application */
  activeVersion?: number;
  /** The name of the application */
  name: string;
  /** Description of the application */
  description: string;
  /** Contact email for the application manager */
  contactEmail?: string;
  /** This should be a landing page for the app. */
  appUserUrl?: string;
  /** Base64 encoded logo image */
  logo?: string;
  /** Redirect URIs users can be sent to after signing up for your application (with their JWT token). */
  redirectUris?: string[];
  /** Addresses responsible for executing the app's operations on behalf of Vincent App Users */
  delegateeAddresses?: string[];
  /** Identifies if an application is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** Whether or not this App is deleted */
  isDeleted?: boolean;
};
export type AppRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Application ID */
  appId: number;
  /** Active version of the application */
  activeVersion?: number;
  /** The name of the application */
  name: string;
  /** Description of the application */
  description: string;
  /** Contact email for the application manager */
  contactEmail?: string;
  /** This should be a landing page for the app. */
  appUserUrl?: string;
  /** Base64 encoded logo image */
  logo?: string;
  /** Redirect URIs users can be sent to after signing up for your application (with their JWT token). */
  redirectUris?: string[];
  /** Addresses responsible for executing the app's operations on behalf of Vincent App Users */
  delegateeAddresses?: string[];
  /** Identifies if an application is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** App manager's wallet address. Derived from the authorization signature provided by the creator. */
  managerAddress: string;
  /** Whether or not this App is deleted */
  isDeleted?: boolean;
};
export type AppList = App[];
export type AppListRead = AppRead[];
export type Error = {
  /** Error code */
  code?: string;
  /** Error message */
  message: string;
};
export type AppCreate = {
  /** Identifies if an application is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** Contact email for the application manager */
  contactEmail?: string;
  /** This should be a landing page for the app. */
  appUserUrl?: string;
  /** Base64 encoded logo image */
  logo?: string;
  /** Redirect URIs users can be sent to after signing up for your application (with their JWT token). */
  redirectUris?: string[];
  /** Addresses responsible for executing the app's operations on behalf of Vincent App Users */
  delegateeAddresses?: string[];
  /** The name of the application */
  name: string;
  /** Description of the application */
  description: string;
};
export type AppEdit = {
  /** The name of the application */
  name?: string;
  /** Description of the application */
  description?: string;
  /** Contact email for the application manager */
  contactEmail?: string;
  /** This should be a landing page for the app. */
  appUserUrl?: string;
  /** Base64 encoded logo image */
  logo?: string;
  /** Redirect URIs users can be sent to after signing up for your application (with their JWT token). */
  redirectUris?: string[];
  /** Addresses responsible for executing the app's operations on behalf of Vincent App Users */
  delegateeAddresses?: string[];
  /** Identifies if an application is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** Active version of the application */
  activeVersion?: number;
};
export type GenericResultMessage = {
  /** Success message */
  message: string;
};
export type AppVersion = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Whether this version is enabled or not */
  enabled: boolean;
  /** Describes what changed between this version and the previous version. */
  changes?: string;
  /** Whether or not this AppVersion is deleted */
  isDeleted?: boolean;
};
export type AppVersionRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Application ID */
  appId: number;
  /** App Version number */
  version: number;
  /** Whether this version is enabled or not */
  enabled: boolean;
  /** Describes what changed between this version and the previous version. */
  changes?: string;
  /** Whether or not this AppVersion is deleted */
  isDeleted?: boolean;
};
export type AppVersionList = AppVersion[];
export type AppVersionListRead = AppVersionRead[];
export type AppVersionCreate = {
  /** Describes what changed between this version and the previous version. */
  changes?: string;
};
export type AppVersionEdit = {
  /** Describes what changed between this version and the previous version. */
  changes?: string;
};
export type AppVersionTool = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Tool package name */
  toolPackageName: string;
  /** Tool version */
  toolVersion: string;
  /** Policies that are supported by this tool, but are hidden from users of this app specifically */
  hiddenSupportedPolicies?: string[];
  /** Whether or not this AppVersionTool is deleted */
  isDeleted?: boolean;
};
export type AppVersionToolRead = {
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
  /** Policies that are supported by this tool, but are hidden from users of this app specifically */
  hiddenSupportedPolicies?: string[];
  /** Whether or not this AppVersionTool is deleted */
  isDeleted?: boolean;
};
export type AppVersionToolList = AppVersionTool[];
export type AppVersionToolListRead = AppVersionToolRead[];
export type AppVersionToolCreate = {
  /** Policies that are supported by this tool, but are hidden from users of this app specifically */
  hiddenSupportedPolicies?: string[];
  /** Tool version */
  toolVersion: string;
};
export type AppVersionToolEdit = {
  /** Policies that are supported by this tool, but are hidden from users of this app specifically */
  hiddenSupportedPolicies?: string[];
};
export type AppSetActiveVersion = {
  /** The version to set as active */
  activeVersion: number;
};
export type Tool = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Tool NPM package name */
  packageName: string;
  /** Tool title - displayed to users in the dashboard/Vincent Explorer UI */
  title: string;
  /** Tool description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
  /** Base64 encoded logo image */
  logo?: string;
  /** Active version of the tool */
  activeVersion: string;
  /** Identifies if a tool is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** Whether or not this Tool is deleted */
  isDeleted?: boolean;
};
export type ToolRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Tool NPM package name */
  packageName: string;
  /** Tool title - displayed to users in the dashboard/Vincent Explorer UI */
  title: string;
  /** Author wallet address. Derived from the authorization signature provided by the creator. */
  authorWalletAddress: string;
  /** Tool description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
  /** Base64 encoded logo image */
  logo?: string;
  /** Active version of the tool */
  activeVersion: string;
  /** Identifies if a tool is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** Whether or not this Tool is deleted */
  isDeleted?: boolean;
};
export type ToolList = Tool[];
export type ToolListRead = ToolRead[];
export type ToolCreate = {
  /** Active version of the tool */
  activeVersion: string;
  /** Tool title - displayed to users in the dashboard/Vincent Explorer UI */
  title: string;
  /** Tool description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
  /** Identifies if a tool is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** Base64 encoded logo image */
  logo?: string;
};
export type ToolEdit = {
  /** Active version of the tool */
  activeVersion?: string;
  /** Tool title - displayed to users in the dashboard/Vincent Explorer UI */
  title?: string;
  /** Tool description - displayed to users in the dashboard/Vincent Explorer UI */
  description?: string;
  /** Identifies if a tool is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** Base64 encoded logo image */
  logo?: string;
};
export type ToolVersion = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Tool NPM package name */
  packageName: string;
  /** Tool version - must be an exact semver. */
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
  /** Whether or not this ToolVersion is deleted */
  isDeleted?: boolean;
};
export type ToolVersionRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Tool NPM package name */
  packageName: string;
  /** Tool version - must be an exact semver. */
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
  /** Supported policies. These are detected from 'dependencies' in the tool's package.json. */
  supportedPolicies: {
    [key: string]: string;
  };
  /** IPFS CID of the code that implements this tool. */
  ipfsCid: string;
  /** Policy versions that are not in the registry but are supported by this tool */
  policiesNotInRegistry: string[];
  /** Whether or not this ToolVersion is deleted */
  isDeleted?: boolean;
};
export type ToolVersionList = ToolVersion[];
export type ToolVersionListRead = ToolVersionRead[];
export type ChangeOwner = {
  /** New owner address */
  authorWalletAddress: string;
};
export type ToolVersionCreate = {
  /** Changelog information for this version */
  changes: string;
};
export type ToolVersionEdit = {
  /** Changelog information for this version */
  changes: string;
};
export type Policy = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Policy NPM package name */
  packageName: string;
  /** Policy description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
  /** Base64 encoded logo image */
  logo?: string;
  /** Active version of the policy; must be an exact semver */
  activeVersion: string;
  /** Policy title for displaying to users in the dashboard/Vincent Explorer UI */
  title: string;
  /** Identifies if a policy is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** Whether or not this Policy is deleted */
  isDeleted?: boolean;
};
export type PolicyRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Policy NPM package name */
  packageName: string;
  /** Author wallet address. Derived from the authorization signature provided by the creator. */
  authorWalletAddress: string;
  /** Policy description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
  /** Base64 encoded logo image */
  logo?: string;
  /** Active version of the policy; must be an exact semver */
  activeVersion: string;
  /** Policy title for displaying to users in the dashboard/Vincent Explorer UI */
  title: string;
  /** Identifies if a policy is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** Whether or not this Policy is deleted */
  isDeleted?: boolean;
};
export type PolicyList = Policy[];
export type PolicyListRead = PolicyRead[];
export type PolicyCreate = {
  /** Active version of the policy; must be an exact semver */
  activeVersion: string;
  /** Policy title for displaying to users in the dashboard/Vincent Explorer UI */
  title: string;
  /** Policy description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
  /** Identifies if a policy is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** Base64 encoded logo image */
  logo?: string;
};
export type PolicyEdit = {
  /** Active version of the policy; must be an exact semver */
  activeVersion?: string;
  /** Policy title for displaying to users in the dashboard/Vincent Explorer UI */
  title?: string;
  /** Policy description - displayed to users in the dashboard/Vincent Explorer UI */
  description?: string;
  /** Identifies if a policy is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** Base64 encoded logo image */
  logo?: string;
};
export type PolicyVersion = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Policy NPM package name */
  packageName: string;
  /** Policy version - must be an exact semver */
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
  /** Whether or not this PolicyVersion is deleted */
  isDeleted?: boolean;
};
export type PolicyVersionRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Policy NPM package name */
  packageName: string;
  /** Policy version - must be an exact semver */
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
  /** IPFS CID of the code that implements this policy. */
  ipfsCid: string;
  /** Schema parameters */
  parameters?: {
    /** UI Schema for parameter display */
    uiSchema: string;
    /** JSON Schema for parameter validation */
    jsonSchema: string;
  };
  /** Whether or not this PolicyVersion is deleted */
  isDeleted?: boolean;
};
export type PolicyVersionCreate = {
  /** Changelog information for this version */
  changes: string;
};
export type PolicyVersionEdit = {
  /** Changelog information for this version */
  changes: string;
};
export type PolicyVersionList = PolicyVersion[];
export type PolicyVersionListRead = PolicyVersionRead[];
export const {
  useListAppsQuery,
  useLazyListAppsQuery,
  useCreateAppMutation,
  useGetAppQuery,
  useLazyGetAppQuery,
  useEditAppMutation,
  useDeleteAppMutation,
  useUndeleteAppMutation,
  useGetAppVersionsQuery,
  useLazyGetAppVersionsQuery,
  useCreateAppVersionMutation,
  useGetAppVersionQuery,
  useLazyGetAppVersionQuery,
  useEditAppVersionMutation,
  useDeleteAppVersionMutation,
  useEnableAppVersionMutation,
  useDisableAppVersionMutation,
  useListAppVersionToolsQuery,
  useLazyListAppVersionToolsQuery,
  useCreateAppVersionToolMutation,
  useEditAppVersionToolMutation,
  useDeleteAppVersionToolMutation,
  useUndeleteAppVersionMutation,
  useUndeleteAppVersionToolMutation,
  useSetAppActiveVersionMutation,
  useListAllToolsQuery,
  useLazyListAllToolsQuery,
  useCreateToolMutation,
  useGetToolQuery,
  useLazyGetToolQuery,
  useEditToolMutation,
  useDeleteToolMutation,
  useGetToolVersionsQuery,
  useLazyGetToolVersionsQuery,
  useChangeToolOwnerMutation,
  useCreateToolVersionMutation,
  useGetToolVersionQuery,
  useLazyGetToolVersionQuery,
  useEditToolVersionMutation,
  useDeleteToolVersionMutation,
  useUndeleteToolMutation,
  useUndeleteToolVersionMutation,
  useListAllPoliciesQuery,
  useLazyListAllPoliciesQuery,
  useCreatePolicyMutation,
  useGetPolicyQuery,
  useLazyGetPolicyQuery,
  useEditPolicyMutation,
  useDeletePolicyMutation,
  useCreatePolicyVersionMutation,
  useGetPolicyVersionQuery,
  useLazyGetPolicyVersionQuery,
  useEditPolicyVersionMutation,
  useDeletePolicyVersionMutation,
  useGetPolicyVersionsQuery,
  useLazyGetPolicyVersionsQuery,
  useChangePolicyOwnerMutation,
  useUndeletePolicyMutation,
  useUndeletePolicyVersionMutation,
} = injectedRtkApi;
