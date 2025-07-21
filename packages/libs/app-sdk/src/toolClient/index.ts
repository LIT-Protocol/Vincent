/** The VincentToolClient is used to handle all interactions with VincentTools -- both local execution of its precheck()
 * method and the execution of its `execute()` method via the LIT Action runtime.  The VincentToolClient also handles calling policy
 * precheck methods when they are defined, and returns all policy precheck results along with the tool precheck result.
 *
 * @packageDocumentation
 */

// src/lib/toolClient/index.ts

export {
  isToolResponseSuccess,
  isToolResponseRuntimeFailure,
  isToolResponseSchemaValidationFailure,
  isToolResponseFailure,
} from './typeGuards';

import { disconnectLitNodeClientInstance } from '../internal/LitNodeClient/getLitNodeClient';

/** This method closes any registered event listeners maintained by Vincent Tool Clients, allowing your process to exit gracefully.
 * @category API
 */
const disconnectVincentToolClients = disconnectLitNodeClientInstance;
export { disconnectVincentToolClients };

export { getVincentToolClient } from './vincentToolClient';
export type { VincentToolClient, ToolClientContext, BaseToolContext } from './types';

export { generateVincentToolSessionSigs } from './execute/generateVincentToolSessionSigs';
export type {
  ToolExecuteResponse,
  ToolExecuteResponseFailureNoResult,
  ToolExecuteResponseFailure,
  ToolExecuteResponseSuccessNoResult,
  ToolExecuteResponseSuccess,
} from './execute/types';

export type {
  ToolPrecheckResponse,
  ToolPrecheckResponseFailureNoResult,
  ToolPrecheckResponseFailure,
  ToolPrecheckResponseSuccessNoResult,
  ToolPrecheckResponseSuccess,
} from './precheck/types';
