// src/abilityClient/execute/resultCreators.ts

import type { z } from 'zod';

import type {
  BaseAbilityContext,
  PolicyEvaluationResultContext,
  SchemaValidationError,
} from '@lit-protocol/vincent-ability-sdk';

import type {
  AbilityExecuteResponseFailure,
  AbilityExecuteResponseFailureNoResult,
  AbilityExecuteResponseSuccess,
  AbilityExecuteResponseSuccessNoResult,
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
    runtimeError?: string;
    schemaValidationError?: SchemaValidationError;
    result: PoliciesByPackageName[keyof PoliciesByPackageName]['__schemaTypes'] extends {
      evalDenyResultSchema: infer Schema;
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
    runtimeError?: string;
    schemaValidationError?: SchemaValidationError;
    result: PoliciesByPackageName[keyof PoliciesByPackageName]['__schemaTypes'] extends {
      evalDenyResultSchema: infer Schema;
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

export function createAbilityExecuteResponseSuccess<
  Success,
  Policies extends Record<any, any>,
>(params: {
  result: Success;
  context?: BaseAbilityContext<PolicyEvaluationResultContext<Policies>>;
}): AbilityExecuteResponseSuccess<Success, Policies> {
  return {
    success: true,
    result: params.result,
    context: params.context,
  };
}

export function createAbilityExecuteResponseSuccessNoResult<
  Policies extends Record<any, any>,
>(params?: {
  context?: BaseAbilityContext<PolicyEvaluationResultContext<Policies>>;
}): AbilityExecuteResponseSuccessNoResult<Policies> {
  return {
    success: true,
    result: undefined,
    context: params?.context,
  };
}

export function createAbilityExecuteResponseFailure<
  Fail,
  Policies extends Record<any, any>,
>(params: {
  result: Fail;
  runtimeError?: string;
  schemaValidationError?: SchemaValidationError;
  context?: BaseAbilityContext<PolicyEvaluationResultContext<Policies>>;
}): AbilityExecuteResponseFailure<Fail, Policies> {
  return {
    success: false,
    runtimeError: params.runtimeError,
    schemaValidationError: params.schemaValidationError,
    result: params.result,
    context: params.context,
  };
}

export function createAbilityExecuteResponseFailureNoResult<
  Policies extends Record<any, any>,
>(params: {
  runtimeError?: string;
  schemaValidationError?: SchemaValidationError;
  context?: BaseAbilityContext<PolicyEvaluationResultContext<Policies>>;
}): AbilityExecuteResponseFailureNoResult<Policies> {
  return {
    success: false,
    runtimeError: params.runtimeError,
    schemaValidationError: params.schemaValidationError,
    result: undefined,
    context: params.context,
  };
}
