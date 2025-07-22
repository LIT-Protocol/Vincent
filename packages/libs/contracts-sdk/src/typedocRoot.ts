// This file exists because all function param and options are inlined and expanded.
// We don't want them to be 'root-level' exports for Typedoc purpose, or they appear under an 'Other' category and are not navigable

// Facets/App exports
export {
  registerApp,
  registerNextVersion,
  enableAppVersion,
  addDelegatee,
  removeDelegatee,
  deleteApp,
  undeleteApp,
} from './facets/App';

// Facets/User exports
export { permitApp, unPermitApp, setToolPolicyParameters } from './facets/User';

// Facets/AppView exports
export {
  getAppById,
  getAppVersion,
  getAppsByManagerAddress,
  getAppByDelegateeAddress,
  getDelegatedPkpEthAddresses,
} from './facets/AppView';

// Facets/UserView exports
export {
  getAllRegisteredAgentPkpEthAddresses,
  getPermittedAppVersionForPkp,
  getAllPermittedAppIdsForPkp,
  getAllToolsAndPoliciesForApp,
  validateToolExecutionAndGetPolicies,
} from './facets/UserView';
