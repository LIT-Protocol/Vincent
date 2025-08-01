import type { Contract, Signer } from 'ethers';

import type { ContractClient } from './types';

import {
  VINCENT_DIAMOND_CONTRACT_ADDRESS_DEV,
  VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
} from './constants';
import {
  registerApp as _registerApp,
  registerNextVersion as _registerNextVersion,
  enableAppVersion as _enableAppVersion,
  addDelegatee as _addDelegatee,
  removeDelegatee as _removeDelegatee,
  deleteApp as _deleteApp,
  undeleteApp as _undeleteApp,
} from './internal/app/App';
import {
  getAppById as _getAppById,
  getAppVersion as _getAppVersion,
  getAppsByManagerAddress as _getAppsByManagerAddress,
  getAppByDelegateeAddress as _getAppByDelegateeAddress,
  getDelegatedPkpEthAddresses as _getDelegatedPkpEthAddresses,
} from './internal/app/AppView';
import {
  permitApp as _permitApp,
  unPermitApp as _unPermitApp,
  setAbilityPolicyParameters as _setAbilityPolicyParameters,
} from './internal/user/User';
import {
  getAllRegisteredAgentPkpEthAddresses as _getAllRegisteredAgentPkpEthAddresses,
  getPermittedAppVersionForPkp as _getPermittedAppVersionForPkp,
  getAllPermittedAppIdsForPkp as _getAllPermittedAppIdsForPkp,
  getAllAbilitiesAndPoliciesForApp as _getAllAbilitiesAndPoliciesForApp,
  validateAbilityExecutionAndGetPolicies as _validateAbilityExecutionAndGetPolicies,
} from './internal/user/UserView';
import { createContract } from './utils';

/** Client method for use in CI or localDev situations where you need to inject an instance of a contract with a custom address
 *
 * @category Internal
 * @internal
 * @private
 * @hidden
 * */
export function clientFromContract({ contract }: { contract: Contract }): ContractClient {
  return {
    // App write methods
    registerApp: (params, overrides) => _registerApp({ contract, args: params, overrides }),
    registerNextVersion: (params, overrides) =>
      _registerNextVersion({ contract, args: params, overrides }),
    enableAppVersion: (params, overrides) =>
      _enableAppVersion({ contract, args: params, overrides }),
    addDelegatee: (params, overrides) => _addDelegatee({ contract, args: params, overrides }),
    removeDelegatee: (params, overrides) => _removeDelegatee({ contract, args: params, overrides }),
    deleteApp: (params, overrides) => _deleteApp({ contract, args: params, overrides }),
    undeleteApp: (params, overrides) => _undeleteApp({ contract, args: params, overrides }),

    // App view methods
    getAppById: (params) => _getAppById({ contract, args: params }),
    getAppVersion: (params) => _getAppVersion({ contract, args: params }),
    getAppsByManagerAddress: (params) => _getAppsByManagerAddress({ contract, args: params }),
    getAppByDelegateeAddress: (params) => _getAppByDelegateeAddress({ contract, args: params }),
    getDelegatedPkpEthAddresses: (params) =>
      _getDelegatedPkpEthAddresses({ contract, args: params }),

    // User write methods
    permitApp: (params, overrides) => _permitApp({ contract, args: params, overrides }),
    unPermitApp: (params, overrides) => _unPermitApp({ contract, args: params, overrides }),
    setAbilityPolicyParameters: (params, overrides) =>
      _setAbilityPolicyParameters({ contract, args: params, overrides }),

    // User view methods
    getAllRegisteredAgentPkpEthAddresses: (params) =>
      _getAllRegisteredAgentPkpEthAddresses({ contract, args: params }),
    getPermittedAppVersionForPkp: (params) =>
      _getPermittedAppVersionForPkp({ contract, args: params }),
    getAllPermittedAppIdsForPkp: (params) =>
      _getAllPermittedAppIdsForPkp({ contract, args: params }),
    getAllAbilitiesAndPoliciesForApp: (params) =>
      _getAllAbilitiesAndPoliciesForApp({ contract, args: params }),
    validateAbilityExecutionAndGetPolicies: (params) =>
      _validateAbilityExecutionAndGetPolicies({ contract, args: params }),
  };
}

/** Get an instance of the contract client that is configured to use a 'development' instance of the contract just for testing purposes
 *
 * State in the development contract should not be considered permanent.  Use {@link getClient} for usage outside of
 * development or CI flows
 *
 * @category API */
export function getTestClient({ signer }: { signer: Signer }): ContractClient {
  const contract = createContract({
    signer,
    contractAddress: VINCENT_DIAMOND_CONTRACT_ADDRESS_DEV,
  });
  return clientFromContract({ contract });
}

/** Get an instance of the contract client that is configured to use a 'production' instance of the contract
 *
 * Please use {@link getTestClient} for temporary / development, or for CI / integration test usage
 *
 * @category API */
export function getClient({ signer }: { signer: Signer }): ContractClient {
  const contract = createContract({
    signer,
    contractAddress: VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
  });
  return clientFromContract({ contract });
}
