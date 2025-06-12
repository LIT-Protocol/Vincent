// src/lib/toolClient/resultCreators.ts

import type { z } from 'zod';

import type {
  ToolResponseFailure,
  ToolResponseFailureNoResult,
  ToolResponseSuccess,
  ToolResponseSuccessNoResult,
} from './types';

import type {
  BaseToolContext,
  PolicyEvaluationResultContext,
} from '@lit-protocol/vincent-tool-sdk';

export function createAllowEvaluationResult<PoliciesByPackageName extends Record<string, any>>(
  evaluatedPolicies: Array<keyof PoliciesByPackageName>,
  allowedPolicies: {
    [K in keyof PoliciesByPackageName]?: {
      result: PoliciesByPackageName[K]['__schemaTypes'] extends {
        evalAllowResultSchema: infer Schema;
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
        evalAllowResultSchema: infer Schema;
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

export function createDenyEvaluationResult<PoliciesByPackageName extends Record<string, any>>(
  evaluatedPolicies: Array<keyof PoliciesByPackageName>,
  allowedPolicies: {
    [K in keyof PoliciesByPackageName]?: {
      result: PoliciesByPackageName[K]['__schemaTypes'] extends {
        evalAllowResultSchema: infer Schema;
      }
        ? Schema extends z.ZodType
          ? z.infer<Schema>
          : never
        : never;
    };
  },
  deniedPolicy: {
    packageName: keyof PoliciesByPackageName;
    result: {
      error?: string;
    } & (PoliciesByPackageName[keyof PoliciesByPackageName]['__schemaTypes'] extends {
      evalDenyResultSchema: infer Schema;
    }
      ? Schema extends z.ZodType
        ? z.infer<Schema>
        : undefined
      : undefined);
  }
): {
  allow: false;
  evaluatedPolicies: Array<keyof PoliciesByPackageName>;
  allowedPolicies: {
    [K in keyof PoliciesByPackageName]?: {
      result: PoliciesByPackageName[K]['__schemaTypes'] extends {
        evalAllowResultSchema: infer Schema;
      }
        ? Schema extends z.ZodType
          ? z.infer<Schema>
          : never
        : never;
    };
  };
  deniedPolicy: {
    packageName: keyof PoliciesByPackageName;
    result: {
      error?: string;
    } & (PoliciesByPackageName[keyof PoliciesByPackageName]['__schemaTypes'] extends {
      evalDenyResultSchema: infer Schema;
    }
      ? Schema extends z.ZodType
        ? z.infer<Schema>
        : undefined
      : undefined);
  };
} {
  return {
    allow: false,
    evaluatedPolicies,
    allowedPolicies,
    deniedPolicy,
  };
}

export function createToolResponseSuccess<Success, Policies extends Record<string, any>>(params: {
  result: Success;
  context?: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}): ToolResponseSuccess<any, Policies> {
  return {
    success: true,
    result: params.result,
    context: params.context,
  };
}

export function createToolResponseSuccessNoResult<Policies extends Record<string, any>>(params?: {
  context?: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}): ToolResponseSuccessNoResult<Policies> {
  return {
    success: true,
    result: undefined,
    context: params?.context,
  };
}

export function createToolResponseFailure<Fail, Policies extends Record<string, any>>(params: {
  result: Fail;
  message?: string;
  context?: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}): ToolResponseFailure<any, Policies> {
  return {
    success: false,
    result: params.result,
    error: params.message,
    context: params.context,
  };
}

export function createToolResponseFailureNoResult<Policies extends Record<string, any>>(params: {
  message?: string;
  context?: BaseToolContext<PolicyEvaluationResultContext<Policies>>;
}): ToolResponseFailureNoResult<Policies> {
  return {
    success: false,
    result: undefined,
    error: params.message,
    context: params.context,
  };
}
