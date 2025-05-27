// src/lib/toolClient/resultCreators.ts

import { z } from 'zod';
import { PolicyEvaluationResultContext } from '../types';
import {
  ToolResponseFailure,
  ToolResponseFailureNoResult,
  ToolResponseSuccess,
  ToolResponseSuccessNoResult,
} from './types';

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
  },
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
  },
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
  policiesContext?: PolicyEvaluationResultContext<Policies>;
}): ToolResponseSuccess<any, Policies> {
  return {
    success: true,
    result: params.result,
    policiesContext: params.policiesContext,
  };
}

export function createToolResponseSuccessNoResult<Policies extends Record<string, any>>(params?: {
  policiesContext?: PolicyEvaluationResultContext<Policies>;
}): ToolResponseSuccessNoResult<Policies> {
  return {
    success: true,
    result: undefined,
    policiesContext: params?.policiesContext,
  };
}

export function createToolResponseFailure<Fail, Policies extends Record<string, any>>(params: {
  result: Fail;
  message?: string;
  policiesContext?: PolicyEvaluationResultContext<Policies>;
}): ToolResponseFailure<any, Policies> {
  return {
    success: false,
    result: params.result,
    error: params.message,
    policiesContext: params.policiesContext,
  };
}

export function createToolResponseFailureNoResult<Policies extends Record<string, any>>(params: {
  message?: string;
  policiesContext?: PolicyEvaluationResultContext<Policies>;
}): ToolResponseFailureNoResult<Policies> {
  return {
    success: false,
    result: undefined,
    error: params.message,
    policiesContext: params.policiesContext,
  };
}
