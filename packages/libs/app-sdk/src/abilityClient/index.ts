/** The VincentAbilityClient is used to handle all interactions with VincentAbilities -- both local execution of its precheck()
 * method and the execution of its `execute()` method via the LIT Action runtime.  The VincentAbilityClient also handles calling policy
 * precheck methods when they are defined, and returns all policy precheck results along with the ability precheck result.
 *
 * @packageDocumentation
 */

// src/lib/abilityClient/index.ts

export {
  isAbilityResponseSuccess,
  isAbilityResponseRuntimeFailure,
  isAbilityResponseSchemaValidationFailure,
  isAbilityResponseFailure,
} from './typeGuards';

import { disconnectLitNodeClientInstance } from '../internal/LitNodeClient/getLitNodeClient';

/** This method closes any registered event listeners maintained by Vincent Ability Clients, allowing your process to exit gracefully.
 * @category API
 */
const disconnectVincentAbilityClients = disconnectLitNodeClientInstance;
export { disconnectVincentAbilityClients };

export { getVincentAbilityClient } from './vincentAbilityClient';
export type { VincentAbilityClient, AbilityClientContext, BaseAbilityContext } from './types';

export { generateVincentAbilitySessionSigs } from './execute/generateVincentAbilitySessionSigs';
export type {
  AbilityExecuteResponse,
  AbilityExecuteResponseFailureNoResult,
  AbilityExecuteResponseFailure,
  AbilityExecuteResponseSuccessNoResult,
  AbilityExecuteResponseSuccess,
} from './execute/types';

export type {
  AbilityPrecheckResponse,
  AbilityPrecheckResponseFailureNoResult,
  AbilityPrecheckResponseFailure,
  AbilityPrecheckResponseSuccessNoResult,
  AbilityPrecheckResponseSuccess,
} from './precheck/types';
