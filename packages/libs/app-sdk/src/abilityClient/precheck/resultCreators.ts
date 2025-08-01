// src/lib/abilityClient/precheck/resultCreators.ts

import type { z } from 'zod';

import type { BaseAbilityContext, SchemaValidationError } from '@lit-protocol/vincent-ability-sdk';

import type {
  AbilityPrecheckResponseFailure,
  AbilityPrecheckResponseFailureNoResult,
  AbilityPrecheckResponseSuccess,
  AbilityPrecheckResponseSuccessNoResult,
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
    runtimeError?: string;
    schemaValidationError?: SchemaValidationError;
    result:
      | (PoliciesByPackageName[keyof PoliciesByPackageName]['__schemaTypes'] extends {
          precheckDenyResultSchema: infer Schema;
        }
          ? Schema extends z.ZodType
            ? z.infer<Schema>
            : undefined
          : undefined)
      | undefined;
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
    runtimeError?: string;
    schemaValidationError?: SchemaValidationError;

    result:
      | (PoliciesByPackageName[keyof PoliciesByPackageName]['__schemaTypes'] extends {
          precheckDenyResultSchema: infer Schema;
        }
          ? Schema extends z.ZodType
            ? z.infer<Schema>
            : undefined
          : undefined)
      | undefined;
  };
} {
  return {
    allow: false,
    evaluatedPolicies,
    allowedPolicies,
    deniedPolicy,
  };
}

export function createAbilityPrecheckResponseSuccess<
  Success,
  Policies extends Record<any, any>,
>(params: {
  result: Success;
  context?: BaseAbilityContext<PolicyPrecheckResultContext<Policies>>;
}): AbilityPrecheckResponseSuccess<Success, Policies> {
  return {
    success: true,
    result: params.result,
    context: params.context,
  };
}

export function createAbilityPrecheckResponseSuccessNoResult<
  Policies extends Record<any, any>,
>(params?: {
  context?: BaseAbilityContext<PolicyPrecheckResultContext<Policies>>;
}): AbilityPrecheckResponseSuccessNoResult<Policies> {
  return {
    success: true,
    result: undefined,
    context: params?.context,
  };
}

export function createAbilityPrecheckResponseFailure<
  Fail,
  Policies extends Record<any, any>,
>(params: {
  runtimeError?: string;
  schemaValidationError?: SchemaValidationError;
  result: Fail;
  context?: BaseAbilityContext<PolicyPrecheckResultContext<Policies>>;
}): AbilityPrecheckResponseFailure<Fail, Policies> {
  return {
    success: false,
    schemaValidationError: params.schemaValidationError,
    runtimeError: params.runtimeError,
    result: params.result,
    context: params.context,
  };
}

export function createAbilityPrecheckResponseFailureNoResult<
  Policies extends Record<any, any>,
>(params: {
  runtimeError?: string;
  schemaValidationError?: SchemaValidationError;
  context?: BaseAbilityContext<PolicyPrecheckResultContext<Policies>>;
}): AbilityPrecheckResponseFailureNoResult<Policies> {
  return {
    success: false,
    runtimeError: params.runtimeError,
    schemaValidationError: params.schemaValidationError,
    result: undefined,
    context: params.context,
  };
}
