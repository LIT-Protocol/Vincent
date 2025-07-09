// src/lib/toolClient/precheck/resultCreators.ts

import type { z } from 'zod';

import type { BaseToolContext } from '@lit-protocol/vincent-tool-sdk';
import type {
  ToolPrecheckResponseFailure,
  ToolPrecheckResponseFailureNoResult,
  ToolPrecheckResponseSuccess,
  ToolPrecheckResponseSuccessNoResult,
  PolicyPrecheckResultContext,
} from './types';

export function createAllowPrecheckResult<PoliciesByPackageName extends Record<string, any>>(
  evaluatedPolicies: Array<keyof PoliciesByPackageName>,
  allowedPolicies: {
    [K in keyof PoliciesByPackageName]?: {
      result: PoliciesByPackageName[K]['__schemaTypes'] extends {
        precheckAllowResultSchema: infer Schema;
      }
        ? Schema extends z.ZodType
          ? z.infer<Schema>
          : never
        : never;
    };
  }
): {
  allow: true;
  evaluatedPolicies: Array<keyof PoliciesByPackageName>;
  allowedPolicies: {
    [K in keyof PoliciesByPackageName]?: {
      result: PoliciesByPackageName[K]['__schemaTypes'] extends {
        precheckAllowResultSchema: infer Schema;
      }
        ? Schema extends z.ZodType
          ? z.infer<Schema>
          : never
        : never;
    };
  };
} {
  return {
    allow: true,
    evaluatedPolicies,
    allowedPolicies,
  };
}

export function createDenyPrecheckResult<PoliciesByPackageName extends Record<string, any>>(
  evaluatedPolicies: Array<keyof PoliciesByPackageName>,
  allowedPolicies: {
    [K in keyof PoliciesByPackageName]?: {
      result: PoliciesByPackageName[K]['__schemaTypes'] extends {
        precheckAllowResultSchema: infer Schema;
      }
        ? Schema extends z.ZodType
          ? z.infer<Schema>
          : never
        : never;
    };
  },
  deniedPolicy: {
    packageName: keyof PoliciesByPackageName;
    error?: string;
    result: PoliciesByPackageName[keyof PoliciesByPackageName]['__schemaTypes'] extends {
      precheckDenyResultSchema: infer Schema;
    }
      ? Schema extends z.ZodType
        ? z.infer<Schema>
        : undefined
      : undefined;
  }
): {
  allow: false;
  evaluatedPolicies: Array<keyof PoliciesByPackageName>;
  allowedPolicies: {
    [K in keyof PoliciesByPackageName]?: {
      result: PoliciesByPackageName[K]['__schemaTypes'] extends {
        precheckAllowResultSchema: infer Schema;
      }
        ? Schema extends z.ZodType
          ? z.infer<Schema>
          : never
        : never;
    };
  };
  deniedPolicy: {
    packageName: keyof PoliciesByPackageName;
    error?: string;
    result: PoliciesByPackageName[keyof PoliciesByPackageName]['__schemaTypes'] extends {
      precheckDenyResultSchema: infer Schema;
    }
      ? Schema extends z.ZodType
        ? z.infer<Schema>
        : undefined
      : undefined;
  };
} {
  return {
    allow: false,
    evaluatedPolicies,
    allowedPolicies,
    deniedPolicy,
  };
}

export function createToolPrecheckResponseSuccess<
  Success,
  Policies extends Record<any, any>,
>(params: {
  result: Success;
  context?: BaseToolContext<PolicyPrecheckResultContext<Policies>>;
}): ToolPrecheckResponseSuccess<Success, Policies> {
  return {
    success: true,
    result: params.result,
    context: params.context,
  };
}

export function createToolPrecheckResponseSuccessNoResult<
  Policies extends Record<any, any>,
>(params?: {
  context?: BaseToolContext<PolicyPrecheckResultContext<Policies>>;
}): ToolPrecheckResponseSuccessNoResult<Policies> {
  return {
    success: true,
    result: undefined,
    context: params?.context,
  };
}

export function createToolPrecheckResponseFailure<Fail, Policies extends Record<any, any>>(params: {
  result: Fail;
  message?: string;
  context?: BaseToolContext<PolicyPrecheckResultContext<Policies>>;
}): ToolPrecheckResponseFailure<Fail, Policies> {
  return {
    success: false,
    result: params.result,
    error: params.message,
    context: params.context,
  };
}

export function createToolPrecheckResponseFailureNoResult<
  Policies extends Record<any, any>,
>(params: {
  message?: string;
  context?: BaseToolContext<PolicyPrecheckResultContext<Policies>>;
}): ToolPrecheckResponseFailureNoResult<Policies> {
  return {
    success: false,
    result: undefined,
    error: params.message,
    context: params.context,
  };
}
