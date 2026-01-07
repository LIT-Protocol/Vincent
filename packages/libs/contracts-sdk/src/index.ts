export type {
  GetAppByDelegateeParams,
  GetAppsByManagerParams,
  GetAppVersionParams,
  GetAppByIdParams,
  GetDelegatedAgentAddressesParams,
  UndeleteAppParams,
  DeleteAppParams,
  RemoveDelegateeParams,
  SetDelegateeParams,
  AddDelegateeParams,
  EnableAppVersionParams,
  RegisterNextVersionParams,
  RegisterAppParams,
  ValidateAbilityExecutionAndGetPoliciesParams,
  IsDelegateePermittedParams,
  GetAllAbilitiesAndPoliciesForAppParams,
  GetPermittedAppVersionForAgentParams,
  GetPermittedAppForAgentsParams,
  GetUnpermittedAppForAgentsParams,
  GetUserAddressForAgentParams,
  GetAllRegisteredAgentAddressesParams,
  SetAbilityPolicyParametersParams,
  UnPermitAppParams,
  PermitAppParams,
  RePermitAppParams,
  AbilityPolicyParameterData,
  Ability,
  App,
  AppVersionAbilities,
  ContractClient,
  ValidateAbilityExecutionAndGetPoliciesResult,
  PermissionData,
  AppVersion,
  PermittedApp,
  UnpermittedApp,
} from './types';

export { getTestClient, clientFromContract, getClient } from './contractClient';

export { createContract } from './utils';

export { getVincentWrappedKeysAccs } from './internal/wrapped-keys/getVincentWrappedKeysAccs';

export {
  VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
  COMBINED_ABI,
  VINCENT_CONTRACT_ADDRESS_BOOK,
  FEE_DIAMOND_ABI,
} from './constants';

export { signOwnerAttestation, getBaseSepoliaFeeDiamondAddress } from './fees/signOwnerAttestation';
export type {
  SignOwnerAttestationParams,
  SignOwnerAttestationResult,
  OwnerAttestation,
} from './fees/signOwnerAttestation';
