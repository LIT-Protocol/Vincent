import { baseVincentRtkApiNode as api } from '../lib/internal/baseVincentRtkApiNode';
export const addTagTypes = [
  'App',
  'AppVersion',
  'AppVersionAbility',
  'Ability',
  'AbilityVersion',
  'Policy',
  'PolicyVersion',
  'User',
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
        invalidatesTags: ['App', 'AppVersion', 'AppVersionAbility'],
      }),
      undeleteApp: build.mutation<UndeleteAppApiResponse, UndeleteAppApiArg>({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/undelete`,
          method: 'POST',
        }),
        invalidatesTags: ['App', 'AppVersion', 'AppVersionAbility'],
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
      listAppVersionAbilities: build.query<
        ListAppVersionAbilitiesApiResponse,
        ListAppVersionAbilitiesApiArg
      >({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.version))}/abilities`,
        }),
        providesTags: ['AppVersionAbility'],
      }),
      createAppVersionAbility: build.mutation<
        CreateAppVersionAbilityApiResponse,
        CreateAppVersionAbilityApiArg
      >({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.appVersion))}/ability/${encodeURIComponent(String(queryArg.abilityPackageName))}`,
          method: 'POST',
          body: queryArg.appVersionAbilityCreate,
        }),
        invalidatesTags: ['AppVersionAbility'],
      }),
      editAppVersionAbility: build.mutation<
        EditAppVersionAbilityApiResponse,
        EditAppVersionAbilityApiArg
      >({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.appVersion))}/ability/${encodeURIComponent(String(queryArg.abilityPackageName))}`,
          method: 'PUT',
          body: queryArg.appVersionAbilityEdit,
        }),
        invalidatesTags: ['AppVersionAbility'],
      }),
      deleteAppVersionAbility: build.mutation<
        DeleteAppVersionAbilityApiResponse,
        DeleteAppVersionAbilityApiArg
      >({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.appVersion))}/ability/${encodeURIComponent(String(queryArg.abilityPackageName))}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['AppVersionAbility'],
      }),
      undeleteAppVersion: build.mutation<UndeleteAppVersionApiResponse, UndeleteAppVersionApiArg>({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.version))}/undelete`,
          method: 'POST',
        }),
        invalidatesTags: ['AppVersion'],
      }),
      undeleteAppVersionAbility: build.mutation<
        UndeleteAppVersionAbilityApiResponse,
        UndeleteAppVersionAbilityApiArg
      >({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.appId))}/version/${encodeURIComponent(String(queryArg.appVersion))}/ability/${encodeURIComponent(String(queryArg.abilityPackageName))}/undelete`,
          method: 'POST',
        }),
        invalidatesTags: ['AppVersionAbility'],
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
      executeBatchAbility: build.mutation<
        ExecuteBatchAbilityApiResponse,
        ExecuteBatchAbilityApiArg
      >({
        query: (queryArg) => ({
          url: `/app/${encodeURIComponent(String(queryArg.abilityName))}/execute`,
          method: 'POST',
          body: queryArg.executeBatchAbilityRequest,
        }),
        invalidatesTags: ['App', 'Ability'],
      }),
      listAllAbilities: build.query<ListAllAbilitiesApiResponse, ListAllAbilitiesApiArg>({
        query: () => ({ url: `/abilities` }),
        providesTags: ['Ability'],
      }),
      createAbility: build.mutation<CreateAbilityApiResponse, CreateAbilityApiArg>({
        query: (queryArg) => ({
          url: `/ability/${encodeURIComponent(String(queryArg.packageName))}`,
          method: 'POST',
          body: queryArg.abilityCreate,
        }),
        invalidatesTags: ['Ability', 'AbilityVersion'],
      }),
      getAbility: build.query<GetAbilityApiResponse, GetAbilityApiArg>({
        query: (queryArg) => ({
          url: `/ability/${encodeURIComponent(String(queryArg.packageName))}`,
        }),
        providesTags: ['Ability'],
      }),
      editAbility: build.mutation<EditAbilityApiResponse, EditAbilityApiArg>({
        query: (queryArg) => ({
          url: `/ability/${encodeURIComponent(String(queryArg.packageName))}`,
          method: 'PUT',
          body: queryArg.abilityEdit,
        }),
        invalidatesTags: ['Ability'],
      }),
      deleteAbility: build.mutation<DeleteAbilityApiResponse, DeleteAbilityApiArg>({
        query: (queryArg) => ({
          url: `/ability/${encodeURIComponent(String(queryArg.packageName))}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Ability', 'AbilityVersion'],
      }),
      getAbilityVersions: build.query<GetAbilityVersionsApiResponse, GetAbilityVersionsApiArg>({
        query: (queryArg) => ({
          url: `/ability/${encodeURIComponent(String(queryArg.packageName))}/versions`,
        }),
        providesTags: ['AbilityVersion'],
      }),
      changeAbilityOwner: build.mutation<ChangeAbilityOwnerApiResponse, ChangeAbilityOwnerApiArg>({
        query: (queryArg) => ({
          url: `/ability/${encodeURIComponent(String(queryArg.packageName))}/owner`,
          method: 'PUT',
          body: queryArg.changeOwner,
        }),
        invalidatesTags: ['Ability'],
      }),
      createAbilityVersion: build.mutation<
        CreateAbilityVersionApiResponse,
        CreateAbilityVersionApiArg
      >({
        query: (queryArg) => ({
          url: `/ability/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}`,
          method: 'POST',
          body: queryArg.abilityVersionCreate,
        }),
        invalidatesTags: ['AbilityVersion'],
      }),
      getAbilityVersion: build.query<GetAbilityVersionApiResponse, GetAbilityVersionApiArg>({
        query: (queryArg) => ({
          url: `/ability/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}`,
        }),
        providesTags: ['AbilityVersion'],
      }),
      editAbilityVersion: build.mutation<EditAbilityVersionApiResponse, EditAbilityVersionApiArg>({
        query: (queryArg) => ({
          url: `/ability/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}`,
          method: 'PUT',
          body: queryArg.abilityVersionEdit,
        }),
        invalidatesTags: ['AbilityVersion'],
      }),
      deleteAbilityVersion: build.mutation<
        DeleteAbilityVersionApiResponse,
        DeleteAbilityVersionApiArg
      >({
        query: (queryArg) => ({
          url: `/ability/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['AbilityVersion'],
      }),
      undeleteAbility: build.mutation<UndeleteAbilityApiResponse, UndeleteAbilityApiArg>({
        query: (queryArg) => ({
          url: `/ability/${encodeURIComponent(String(queryArg.packageName))}/undelete`,
          method: 'POST',
        }),
        invalidatesTags: ['Ability', 'AbilityVersion'],
      }),
      undeleteAbilityVersion: build.mutation<
        UndeleteAbilityVersionApiResponse,
        UndeleteAbilityVersionApiArg
      >({
        query: (queryArg) => ({
          url: `/ability/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}/undelete`,
          method: 'POST',
        }),
        invalidatesTags: ['AbilityVersion'],
      }),
      refreshAbilityVersionPolicies: build.mutation<
        RefreshAbilityVersionPoliciesApiResponse,
        RefreshAbilityVersionPoliciesApiArg
      >({
        query: (queryArg) => ({
          url: `/ability/${encodeURIComponent(String(queryArg.packageName))}/version/${encodeURIComponent(String(queryArg.version))}/refresh-policies`,
          method: 'POST',
        }),
        invalidatesTags: ['AbilityVersion'],
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
      installApp: build.mutation<InstallAppApiResponse, InstallAppApiArg>({
        query: (queryArg) => ({
          url: `/user/${encodeURIComponent(String(queryArg.appId))}/install-app`,
          method: 'POST',
          body: queryArg.installAppRequest,
        }),
        invalidatesTags: ['User'],
      }),
      completeInstallation: build.mutation<
        CompleteInstallationApiResponse,
        CompleteInstallationApiArg
      >({
        query: (queryArg) => ({
          url: `/user/${encodeURIComponent(String(queryArg.appId))}/complete-installation`,
          method: 'POST',
          body: queryArg.completeInstallationRequest,
        }),
        invalidatesTags: ['User'],
      }),
      getAgentAccount: build.mutation<GetAgentAccountApiResponse, GetAgentAccountApiArg>({
        query: (queryArg) => ({
          url: `/user/${encodeURIComponent(String(queryArg.appId))}/agent-account`,
          method: 'POST',
          body: queryArg.getAgentAccountRequest,
        }),
        invalidatesTags: ['User'],
      }),
      uninstallApp: build.mutation<UninstallAppApiResponse, UninstallAppApiArg>({
        query: (queryArg) => ({
          url: `/user/${encodeURIComponent(String(queryArg.appId))}/uninstall-app`,
          method: 'POST',
          body: queryArg.uninstallAppRequest,
        }),
        invalidatesTags: ['User'],
      }),
      completeUninstall: build.mutation<CompleteUninstallApiResponse, CompleteUninstallApiArg>({
        query: (queryArg) => ({
          url: `/user/${encodeURIComponent(String(queryArg.appId))}/complete-uninstall`,
          method: 'POST',
          body: queryArg.completeUninstallRequest,
        }),
        invalidatesTags: ['User'],
      }),
      getAgentFunds: build.mutation<GetAgentFundsApiResponse, GetAgentFundsApiArg>({
        query: (queryArg) => ({
          url: `/user/${encodeURIComponent(String(queryArg.appId))}/agent-funds`,
          method: 'POST',
          body: queryArg.getAgentFundsRequest,
        }),
        invalidatesTags: ['User'],
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as vincentApiClientNode };
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
export type ListAppVersionAbilitiesApiResponse =
  /** status 200 Successful operation */ AppVersionAbilityListRead;
export type ListAppVersionAbilitiesApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  version: number;
};
export type CreateAppVersionAbilityApiResponse =
  /** status 200 Successful operation */ AppVersionAbilityRead;
export type CreateAppVersionAbilityApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  appVersion: number;
  /** The NPM package name */
  abilityPackageName: string;
  /** Ability configuration for the application version */
  appVersionAbilityCreate: AppVersionAbilityCreate;
};
export type EditAppVersionAbilityApiResponse =
  /** status 200 Successful operation */ AppVersionAbilityRead;
export type EditAppVersionAbilityApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  appVersion: number;
  /** The NPM package name */
  abilityPackageName: string;
  /** Updated ability configuration for the application version */
  appVersionAbilityEdit: AppVersionAbilityEdit;
};
export type DeleteAppVersionAbilityApiResponse =
  /** status 200 OK - Resource successfully deleted */ GenericResultMessage;
export type DeleteAppVersionAbilityApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  appVersion: number;
  /** The NPM package name */
  abilityPackageName: string;
};
export type UndeleteAppVersionApiResponse =
  /** status 200 OK - Resource successfully undeleted */ GenericResultMessage;
export type UndeleteAppVersionApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  version: number;
};
export type UndeleteAppVersionAbilityApiResponse =
  /** status 200 OK - Resource successfully undeleted */ GenericResultMessage;
export type UndeleteAppVersionAbilityApiArg = {
  /** ID of the target application */
  appId: number;
  /** Version # of the target application version */
  appVersion: number;
  /** The NPM package name */
  abilityPackageName: string;
};
export type SetAppActiveVersionApiResponse =
  /** status 200 OK - Active version successfully set */ GenericResultMessage;
export type SetAppActiveVersionApiArg = {
  /** ID of the target application */
  appId: number;
  /** The version to set as active */
  appSetActiveVersion: AppSetActiveVersion;
};
export type ExecuteBatchAbilityApiResponse =
  /** status 200 Batch execution completed (some delegators may have failed, check individual results) */ ExecuteBatchAbilityResponse;
export type ExecuteBatchAbilityApiArg = {
  /** URL-friendly ability name (e.g., "relay-link") */
  abilityName: string;
  /** Batch execution request with delegatee credentials and delegator parameters */
  executeBatchAbilityRequest: ExecuteBatchAbilityRequest;
};
export type ListAllAbilitiesApiResponse = /** status 200 Successful operation */ AbilityListRead;
export type ListAllAbilitiesApiArg = void;
export type CreateAbilityApiResponse = /** status 200 Successful operation */ AbilityRead;
export type CreateAbilityApiArg = {
  /** The NPM package name */
  packageName: string;
  /** Developer-defined ability details */
  abilityCreate: AbilityCreate;
};
export type GetAbilityApiResponse = /** status 200 Successful operation */ AbilityRead;
export type GetAbilityApiArg = {
  /** The NPM package name */
  packageName: string;
};
export type EditAbilityApiResponse = /** status 200 Successful operation */ AbilityRead;
export type EditAbilityApiArg = {
  /** The NPM package name */
  packageName: string;
  /** Developer-defined updated ability details */
  abilityEdit: AbilityEdit;
};
export type DeleteAbilityApiResponse = /** status 200 Successful operation */ GenericResultMessage;
export type DeleteAbilityApiArg = {
  /** The NPM package name */
  packageName: string;
};
export type GetAbilityVersionsApiResponse =
  /** status 200 Successful operation */ AbilityVersionListRead;
export type GetAbilityVersionsApiArg = {
  /** The NPM package name */
  packageName: string;
};
export type ChangeAbilityOwnerApiResponse = /** status 200 Successful operation */ AbilityRead;
export type ChangeAbilityOwnerApiArg = {
  /** The NPM package name */
  packageName: string;
  /** Developer-defined updated ability details */
  changeOwner: ChangeOwner;
};
export type CreateAbilityVersionApiResponse =
  /** status 200 Successful operation */ AbilityVersionRead;
export type CreateAbilityVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target ability version */
  version: string;
  /** Developer-defined version details */
  abilityVersionCreate: AbilityVersionCreate;
};
export type GetAbilityVersionApiResponse =
  /** status 200 Successful operation */ AbilityVersionRead;
export type GetAbilityVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target ability version */
  version: string;
};
export type EditAbilityVersionApiResponse =
  /** status 200 Successful operation */ AbilityVersionRead;
export type EditAbilityVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target ability version */
  version: string;
  /** Update version changes field */
  abilityVersionEdit: AbilityVersionEdit;
};
export type DeleteAbilityVersionApiResponse =
  /** status 200 OK - Resource successfully deleted */ GenericResultMessage;
export type DeleteAbilityVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target ability version */
  version: string;
};
export type UndeleteAbilityApiResponse =
  /** status 200 Successful operation */ GenericResultMessage;
export type UndeleteAbilityApiArg = {
  /** The NPM package name */
  packageName: string;
};
export type UndeleteAbilityVersionApiResponse =
  /** status 200 OK - Resource successfully undeleted */ GenericResultMessage;
export type UndeleteAbilityVersionApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target ability version */
  version: string;
};
export type RefreshAbilityVersionPoliciesApiResponse =
  /** status 200 OK - Policies successfully refreshed */ AbilityVersionRead;
export type RefreshAbilityVersionPoliciesApiArg = {
  /** The NPM package name */
  packageName: string;
  /** NPM semver of the target ability version */
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
export type InstallAppApiResponse =
  /** status 200 App installation data returned successfully */ InstallAppResponse;
export type InstallAppApiArg = {
  /** ID of the target application */
  appId: number;
  installAppRequest: InstallAppRequest;
};
export type CompleteInstallationApiResponse =
  /** status 200 Installation completed successfully */ CompleteInstallationResponse;
export type CompleteInstallationApiArg = {
  /** ID of the target application */
  appId: number;
  completeInstallationRequest: CompleteInstallationRequest;
};
export type GetAgentAccountApiResponse =
  /** status 200 Agent account address returned successfully */ GetAgentAccountResponse;
export type GetAgentAccountApiArg = {
  /** ID of the target application */
  appId: number;
  getAgentAccountRequest: GetAgentAccountRequest;
};
export type UninstallAppApiResponse =
  /** status 200 Uninstall data returned successfully */ UninstallAppResponse;
export type UninstallAppApiArg = {
  /** ID of the target application */
  appId: number;
  uninstallAppRequest: UninstallAppRequest;
};
export type CompleteUninstallApiResponse =
  /** status 200 Uninstall completed successfully */ CompleteUninstallResponse;
export type CompleteUninstallApiArg = {
  /** ID of the target application */
  appId: number;
  completeUninstallRequest: CompleteUninstallRequest;
};
export type GetAgentFundsApiResponse =
  /** status 200 Agent funds returned successfully */ GetAgentFundsResponse;
export type GetAgentFundsApiArg = {
  /** ID of the target application */
  appId: number;
  getAgentFundsRequest: GetAgentFundsRequest;
};
export type App = {
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
  appUrl?: string;
  /** Base64 encoded logo image */
  logo?: string;
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
  appUrl?: string;
  /** Base64 encoded logo image */
  logo?: string;
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
  appUrl?: string;
  /** Base64 encoded logo image */
  logo?: string;
  /** Application ID */
  appId: number;
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
  appUrl?: string;
  /** Base64 encoded logo image */
  logo?: string;
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
export type AppVersionAbility = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Ability package name */
  abilityPackageName: string;
  /** Ability version */
  abilityVersion: string;
  /** Policies that are supported by this ability, but are hidden from users of this app specifically */
  hiddenSupportedPolicies?: string[];
  /** Whether or not this AppVersionAbility is deleted */
  isDeleted?: boolean;
};
export type AppVersionAbilityRead = {
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
  /** Ability package name */
  abilityPackageName: string;
  /** Ability version */
  abilityVersion: string;
  /** Policies that are supported by this ability, but are hidden from users of this app specifically */
  hiddenSupportedPolicies?: string[];
  /** Whether or not this AppVersionAbility is deleted */
  isDeleted?: boolean;
};
export type AppVersionAbilityList = AppVersionAbility[];
export type AppVersionAbilityListRead = AppVersionAbilityRead[];
export type AppVersionAbilityCreate = {
  /** Policies that are supported by this ability, but are hidden from users of this app specifically */
  hiddenSupportedPolicies?: string[];
  /** Ability version */
  abilityVersion: string;
};
export type AppVersionAbilityEdit = {
  /** Policies that are supported by this ability, but are hidden from users of this app specifically */
  hiddenSupportedPolicies?: string[];
};
export type AppSetActiveVersion = {
  /** The version to set as active */
  activeVersion: number;
};
export type DelegatorExecutionResultSuccess = {
  success: true;
  /** Transaction hash of the executed UserOperation */
  transactionHash: string;
  /** UserOperation hash */
  userOpHash: string;
};
export type DelegatorExecutionResultFailure = {
  success: false;
  /** Error message describing why the execution failed */
  error: string;
};
export type DelegatorExecutionResult =
  | DelegatorExecutionResultSuccess
  | DelegatorExecutionResultFailure;
export type ExecuteBatchAbilityResponse = {
  /** Map of delegator addresses to their execution results */
  results: {
    [key: string]: DelegatorExecutionResult;
  };
};
export type BatchDelegator = {
  /** Ethereum address of the delegator (user who delegated ability to the app) */
  delegatorAddress: string;
  /** Ability-specific parameters for this delegator, which override the defaults */
  abilityParams: {
    [key: string]: any | null;
  };
};
export type ExecuteBatchAbilityRequest = {
  /** Private key of the delegatee (app PKP). Used to derive the app ID automatically. */
  delegateePrivateKey: string;
  /** Default parameters for the ability execution that apply to all delegators unless overridden */
  defaults?: {
    [key: string]: any | null;
  };
  /** Array of delegators to execute the ability for */
  delegators: BatchDelegator[];
};
export type Ability = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Ability NPM package name */
  packageName: string;
  /** Ability title - displayed to users in the dashboard/Vincent Explorer UI */
  title: string;
  /** Ability description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
  /** Base64 encoded logo image */
  logo?: string;
  /** Active version of the ability */
  activeVersion: string;
  /** Identifies if an ability is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** Whether or not this Ability is deleted */
  isDeleted?: boolean;
};
export type AbilityRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Ability NPM package name */
  packageName: string;
  /** Ability title - displayed to users in the dashboard/Vincent Explorer UI */
  title: string;
  /** Author wallet address. Derived from the authorization signature provided by the creator. */
  authorWalletAddress: string;
  /** Ability description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
  /** Base64 encoded logo image */
  logo?: string;
  /** Active version of the ability */
  activeVersion: string;
  /** Identifies if an ability is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** Whether or not this Ability is deleted */
  isDeleted?: boolean;
};
export type AbilityList = Ability[];
export type AbilityListRead = AbilityRead[];
export type AbilityCreate = {
  /** Active version of the ability */
  activeVersion: string;
  /** Ability title - displayed to users in the dashboard/Vincent Explorer UI */
  title: string;
  /** Ability description - displayed to users in the dashboard/Vincent Explorer UI */
  description: string;
  /** Identifies if an ability is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** Base64 encoded logo image */
  logo?: string;
};
export type AbilityEdit = {
  /** Active version of the ability */
  activeVersion?: string;
  /** Ability title - displayed to users in the dashboard/Vincent Explorer UI */
  title?: string;
  /** Ability description - displayed to users in the dashboard/Vincent Explorer UI */
  description?: string;
  /** Identifies if an ability is in development, test, or production. */
  deploymentStatus?: 'dev' | 'test' | 'prod';
  /** Base64 encoded logo image */
  logo?: string;
};
export type AbilityVersion = {
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Ability NPM package name */
  packageName: string;
  /** Ability version - must be an exact semver. */
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
  /** Whether or not this AbilityVersion is deleted */
  isDeleted?: boolean;
};
export type AbilityVersionRead = {
  /** Document ID */
  _id: string;
  /** Timestamp when this was last modified */
  updatedAt: string;
  /** Timestamp when this was created */
  createdAt: string;
  /** Ability NPM package name */
  packageName: string;
  /** Ability version - must be an exact semver. */
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
  /** Supported policies. These are detected from 'dependencies' in the ability's package.json. */
  supportedPolicies: {
    [key: string]: string;
  };
  /** IPFS CID of the code that implements this ability. */
  ipfsCid: string;
  /** Policy versions that are not in the registry but are supported by this ability */
  policiesNotInRegistry: string[];
  /** Whether or not this AbilityVersion is deleted */
  isDeleted?: boolean;
};
export type AbilityVersionList = AbilityVersion[];
export type AbilityVersionListRead = AbilityVersionRead[];
export type ChangeOwner = {
  /** New owner address */
  authorWalletAddress: string;
};
export type AbilityVersionCreate = {
  /** Changelog information for this version */
  changes: string;
};
export type AbilityVersionEdit = {
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
export type InstallAppResponse = {
  /** The PKP address that the app will use to sign things */
  agentSignerAddress: string;
  /** The smart account address calculated from the PKP address, used on the frontend to verify they get the same smart wallet address */
  agentSmartAccountAddress: string;
  /** The EIP2771 TypedData to sign for permitAppVersion via Gelato relay (gas-sponsored). Contains the transaction details for permitting the app version on the Vincent registry. */
  appInstallationDataToSign?: {
    /** Chain ID where the transaction will be executed */
    chainId: string | number;
    /** Target contract address */
    target: string;
    /** Encoded function call data */
    data: string;
    /** User address that will sign the typed data */
    user: string;
    /** User nonce for replay protection */
    userNonce: string | number;
    /** Deadline timestamp for the transaction */
    userDeadline: string | number;
  };
  /** Data for signing the smart account deployment UserOperation. Contains messageToSign (hex hash) and the complete userOperation object that will be submitted with the signature. */
  agentSmartAccountDeploymentDataToSign?: {
    /** Hex-encoded message hash to sign for UserOperation */
    messageToSign: string;
    /** Complete UserOperation object that will be submitted with the signature */
    userOperation: {
      /** Smart account address */
      sender: string;
      /** Account nonce as string */
      nonce: string;
      /** Factory address for account deployment */
      factory?: string;
      /** Factory calldata for deployment */
      factoryData?: string;
      /** Calldata for the account to execute */
      callData: string;
      /** Gas limit for the call */
      callGasLimit: string;
      /** Gas limit for verification */
      verificationGasLimit: string;
      /** Gas for pre-verification */
      preVerificationGas: string;
      /** Maximum fee per gas */
      maxFeePerGas: string;
      /** Maximum priority fee per gas */
      maxPriorityFeePerGas: string;
      /** Paymaster address */
      paymaster?: string;
      /** Gas limit for paymaster verification */
      paymasterVerificationGasLimit?: string;
      /** Gas limit for paymaster post-op */
      paymasterPostOpGasLimit?: string;
      /** Paymaster-specific data */
      paymasterData?: string;
      /** Signature placeholder */
      signature?: string;
    };
  };
  /** EIP-712 TypedData for session key approval. This enables the PKP signer to act on behalf of the smart account by granting it permission to execute transactions. */
  sessionKeyApprovalDataToSign?: {
    /** EIP-712 domain */
    domain?: {
      name?: string;
      version?: string;
      chainId?: string | number;
      verifyingContract?: string;
      salt?: string;
    };
    /** EIP-712 type definitions */
    types: {
      [key: string]: {
        name: string;
        type: string;
      }[];
    };
    /** Primary type name */
    primaryType?: string;
    /** Message to sign */
    message: string;
  };
  /** True if the app is already installed for this user. If true, the typed data fields will be undefined. */
  alreadyInstalled?: boolean;
};
export type InstallAppRequest = {
  /** EOA address that controls the user smart wallet */
  userControllerAddress: string;
  /** If true (default), returns EIP2771 typed data for sponsored gas relay. If false, returns raw transaction data for direct EOA submission (user pays gas). */
  sponsorGas?: boolean;
};
export type CompleteInstallationResponse = {
  /** Transaction hash for smart account deployment */
  deployAgentSmartAccountTransactionHash: string;
  /** Serialized permission account that can be used by the PKP to sign transactions. The permission plugin will be automatically enabled on-chain when the PKP submits its first UserOperation. */
  serializedPermissionAccount: string;
  /** Transaction hash for permitAppVersion (app installation completion) */
  completeAppInstallationTransactionHash: string;
};
export type CompleteInstallationRequest = {
  /** EOA address that controls the user smart wallet */
  userControllerAddress: string;
  /** The Vincent app ID */
  appId: number;
  /** The PKP address that will be used as the agent signer */
  agentSignerAddress: string;
  /** Signed EIP2771 typed data for permitAppVersion transaction */
  appInstallation: {
    /** The signature of the EIP2771 typed data */
    typedDataSignature: string;
    /** The original EIP2771 typed data that was signed */
    dataToSign: {};
  };
  /** Signed UserOperation for smart account deployment */
  agentSmartAccountDeployment: {
    /** The signature of the UserOperation message hash */
    typedDataSignature: string;
    /** The UserOperation that was signed for smart account deployment */
    userOperation: {};
  };
  /** Signed permission account data for session key approval */
  sessionKeyApproval: {
    /** The signature of the session key approval EIP-712 typed data */
    typedDataSignature: string;
  };
};
export type GetAgentAccountResponse = {
  /** The agent smart account address if registered, or null if the agent does not exist */
  agentAddress: string | null;
};
export type GetAgentAccountRequest = {
  /** EOA address that controls the user smart wallet */
  userControllerAddress: string;
};
export type UninstallAppResponse = {
  /** Raw transaction data for direct EOA submission. Present when sponsorGas=false. */
  rawTransaction?: {
    /** The target contract address */
    to: string;
    /** The encoded transaction data */
    data: string;
  };
  /** The EIP2771 TypedData to sign for sponsored gas relay. Present when sponsorGas=true (default). */
  uninstallDataToSign?: {};
};
export type UninstallAppRequest = {
  /** The version of the app to uninstall */
  appVersion: number;
  /** EOA address that controls the user smart wallet */
  userControllerAddress: string;
  /** If true (default), returns EIP2771 typed data for sponsored gas relay. If false, returns raw transaction data for direct EOA submission (user pays gas). */
  sponsorGas?: boolean;
};
export type CompleteUninstallResponse = {
  /** The transaction hash of the completed uninstall transaction */
  transactionHash: string;
};
export type CompleteUninstallRequest = {
  /** The signature of the typed data from the user wallet */
  typedDataSignature: string;
  /** The uninstallDataToSign object returned from uninstall-app. Generated by the Gelato SDK. */
  uninstallDataToSign: {};
};
export type GetAgentFundsResponse = {
  /** The derived agent smart account address */
  agentAddress: string;
  /** List of tokens held by the agent */
  tokens: {
    /** Wallet address that holds the token */
    address: string;
    /** Network identifier */
    network: string;
    /** Token contract address */
    tokenAddress: string;
    /** Token balance in wei/smallest unit */
    tokenBalance: string;
    tokenMetadata?: {
      /** Token decimals */
      decimals: number;
      /** Token logo URL */
      logo: string | null;
      /** Token name */
      name: string;
      /** Token symbol */
      symbol: string;
    };
    tokenPrices?: {
      /** Price currency */
      currency: string;
      /** Price value */
      value: string;
      /** Last price update timestamp */
      lastUpdatedAt: string;
    }[];
    /** Error message if applicable */
    error?: string | null;
  }[];
  /** Pagination key for fetching more results */
  pageKey?: string;
};
export type GetAgentFundsRequest = {
  /** The Ethereum address of the user controller wallet */
  userControllerAddress: string;
  /** Networks to query for token balances */
  networks: string[];
};
