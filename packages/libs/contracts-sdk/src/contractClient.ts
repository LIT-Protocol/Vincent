import type { Contract, Signer } from 'ethers';

import type { ContractClient } from './types';

import { VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD } from './constants';
import {
  registerApp as _registerApp,
  registerNextVersion as _registerNextVersion,
  enableAppVersion as _enableAppVersion,
  addDelegatee as _addDelegatee,
  removeDelegatee as _removeDelegatee,
  setDelegatee as _setDelegatee,
  deleteApp as _deleteApp,
  undeleteApp as _undeleteApp,
} from './internal/app/App';
import {
  getAppById as _getAppById,
  getAppIdByDelegatee as _getAppIdByDelegatee,
  getAppVersion as _getAppVersion,
  getAppsByManagerAddress as _getAppsByManagerAddress,
  getAppByDelegateeAddress as _getAppByDelegateeAddress,
  getDelegatedAgentAddresses as _getDelegatedAgentAddresses,
} from './internal/app/AppView';
import {
  permitApp as _permitApp,
  unPermitApp as _unPermitApp,
  rePermitApp as _rePermitApp,
  setAbilityPolicyParameters as _setAbilityPolicyParameters,
} from './internal/user/User';
import {
  getAllRegisteredAgentAddressesForUser as _getAllRegisteredAgentAddressesForUser,
  getPermittedAppForAgents as _getPermittedAppForAgents,
  getUnpermittedAppForAgents as _getUnpermittedAppForAgents,
  getUserAddressForAgent as _getUserAddressForAgent,
  getAllAbilitiesAndPoliciesForApp as _getAllAbilitiesAndPoliciesForApp,
  validateAbilityExecutionAndGetPolicies as _validateAbilityExecutionAndGetPolicies,
  isDelegateePermitted as _isDelegateePermitted,
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
    setDelegatee: (params, overrides) => _setDelegatee({ contract, args: params, overrides }),
    deleteApp: (params, overrides) => _deleteApp({ contract, args: params, overrides }),
    undeleteApp: (params, overrides) => _undeleteApp({ contract, args: params, overrides }),

    // App view methods
    getAppById: (params) => _getAppById({ contract, args: params }),
    getAppIdByDelegatee: (params) => _getAppIdByDelegatee({ contract, args: params }),
    getAppVersion: (params) => _getAppVersion({ contract, args: params }),
    getAppsByManagerAddress: (params) => _getAppsByManagerAddress({ contract, args: params }),
    getAppByDelegateeAddress: (params) => _getAppByDelegateeAddress({ contract, args: params }),
    getDelegatedAgentAddresses: (params) => _getDelegatedAgentAddresses({ contract, args: params }),

    // User write methods
    permitApp: (params, overrides) => _permitApp({ contract, args: params, overrides }),
    unPermitApp: (params, overrides) => _unPermitApp({ contract, args: params, overrides }),
    rePermitApp: (params, overrides) => _rePermitApp({ contract, args: params, overrides }),
    setAbilityPolicyParameters: (params, overrides) =>
      _setAbilityPolicyParameters({ contract, args: params, overrides }),

    // User view methods
    getAllRegisteredAgentAddressesForUser: (params) =>
      _getAllRegisteredAgentAddressesForUser({ contract, args: params }),
    getUserAddressForAgent: (params) => _getUserAddressForAgent({ contract, args: params }),
    getPermittedAppForAgents: (params) => _getPermittedAppForAgents({ contract, args: params }),
    getUnpermittedAppForAgents: (params) => _getUnpermittedAppForAgents({ contract, args: params }),
    getAllAbilitiesAndPoliciesForApp: (params) =>
      _getAllAbilitiesAndPoliciesForApp({ contract, args: params }),
    validateAbilityExecutionAndGetPolicies: (params) =>
      _validateAbilityExecutionAndGetPolicies({ contract, args: params }),
    isDelegateePermitted: (params) => _isDelegateePermitted({ contract, args: params }),
  };
}

/** Get an instance of the contract client that is configured to use a 'production' instance of the contract
 *
 * Please use {@link getTestClient} for temporary / development, or for CI / integration test usage
 *
 * @category API */
export function getClient({
  signer,
  contractAddress,
}: {
  signer: Signer;
  contractAddress?: string;
}): ContractClient {
  const contract = createContract({
    signer,
    contractAddress: contractAddress ?? VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
  });
  return clientFromContract({ contract });
}

/** Get an instance of the contract client that is configured to use a test/dev instance of the contract
 *
 * @category API */
export function getTestClient({
  signer,
  contractAddress,
}: {
  signer: Signer;
  contractAddress?: string;
}): ContractClient {
  const contract = createContract({
    signer,
    contractAddress: contractAddress ?? VINCENT_DIAMOND_CONTRACT_ADDRESS_PROD,
  });
  return clientFromContract({ contract });
}
