// src/lib/toolClient/index.ts

export { getVincentToolClient } from './vincentToolClient';
export type { VincentToolClient, ToolClientContext, BaseToolContext } from './types';

export { generateVincentToolSessionSigs } from './execute/generateVincentToolSessionSigs';
export type { RemoteVincentToolExecutionResult } from './execute/types';
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
