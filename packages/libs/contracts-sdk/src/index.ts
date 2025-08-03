export type {
  // TODO: Remove duplicate types from multiple files
  GetAppByDelegateeParams,
  GetAppsByManagerParams,
  GetAppVersionParams,
  GetAppByIdParams,
  UndeleteAppParams,
  DeleteAppParams,
  RemoveDelegateeParams,
  AddDelegateeParams,
  EnableAppVersionParams,
  RegisterNextVersionParams,
  RegisterAppParams,
  ValidateAbilityExecutionAndGetPoliciesParams,
  GetDelegatedPkpEthAddressesParams,
  GetAllAbilitiesAndPoliciesForAppParams,
  GetAllPermittedAppIdsForPkpParams,
  GetPermittedAppVersionForPkpParams,
  GetAllRegisteredAgentPkpsParams,
  SetAbilityPolicyParametersParams,
  UnPermitAppParams,
  PermitAppParams,
  AbilityPolicyParameterData,
  Ability,
  App,
  AppVersionAbilities,
  ContractClient,
  ValidateAbilityExecutionAndGetPoliciesResult,
  PermissionData,
  AppVersion,
} from './types';

export { getTestClient, clientFromContract, getClient } from './contractClient';

export { createContract } from './utils';
