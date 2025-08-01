// src/lib/abilityClient/precheck/types.ts

import type { z } from 'zod';

import type { BaseAbilityContext, SchemaValidationError } from '@lit-protocol/vincent-ability-sdk';
import type { VincentPolicy } from '@lit-protocol/vincent-ability-sdk/internal';

/* eslint-disable @typescript-eslint/no-unsafe-function-type */

/** @category Interfaces */
export interface AbilityPrecheckResponseSuccess<Result, Policies extends Record<string, any>> {
  success: true;
  result: Result;
  context?: BaseAbilityContext<PolicyPrecheckResultContext<Policies>>;
}

/** @category Interfaces */
export interface AbilityPrecheckResponseSuccessNoResult<Policies extends Record<string, any>> {
  success: true;
  result?: never;
  context?: BaseAbilityContext<PolicyPrecheckResultContext<Policies>>;
}

/** @category Interfaces */
export interface AbilityPrecheckResponseFailure<Result, Policies extends Record<string, any>> {
  success: false;
  runtimeError?: string;
  schemaValidationError?: SchemaValidationError;
  result: Result;
  context?: BaseAbilityContext<PolicyPrecheckResultContext<Policies>>;
}

/** @category Interfaces */
export interface AbilityPrecheckResponseFailureNoResult<Policies extends Record<string, any>> {
  success: false;
  runtimeError?: string;
  schemaValidationError?: SchemaValidationError;
  result?: never;
  context?: BaseAbilityContext<PolicyPrecheckResultContext<Policies>>;
}

/** @category Interfaces */
export type AbilityPrecheckResponse<
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
  Policies extends Record<string, any>,
> =
  | (SuccessSchema extends z.ZodType
      ? AbilityPrecheckResponseSuccess<z.infer<SuccessSchema>, Policies>
      : AbilityPrecheckResponseSuccessNoResult<Policies>)
  | (FailSchema extends z.ZodType
      ? AbilityPrecheckResponseFailure<z.infer<FailSchema>, Policies>
      : AbilityPrecheckResponseFailureNoResult<Policies>);

export interface RemoteVincentAbilityExecutionResult<
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
  Policies extends Record<string, any>,
> {
  abilityExecutionResult: AbilityPrecheckResponse<SuccessSchema, FailSchema, Policies>;
  abilityContext: BaseAbilityContext<PolicyPrecheckResultContext<Policies>>;
}

export type PolicyPrecheckResultContext<
  Policies extends Record<
    string,
    {
      vincentPolicy: VincentPolicy<any, any, any, any, any, any, any, any, any, any>;
      /** @hidden */
      __schemaTypes?: {
        policyAbilityParamsSchema: z.ZodType;
        userParamsSchema?: z.ZodType;
        evalAllowResultSchema?: z.ZodType;
        evalDenyResultSchema?: z.ZodType;
        commitParamsSchema?: z.ZodType;
        commitAllowResultSchema?: z.ZodType;
        commitDenyResultSchema?: z.ZodType;
        evaluate?: Function;
        precheck?: Function;
        commit?: Function;
      };
    }
  >,
> = {
  evaluatedPolicies: Array<keyof Policies>;
} & (
  | {
      allow: true;
      allowedPolicies: {
        [PolicyKey in keyof Policies]?: {
          result: Policies[PolicyKey]['__schemaTypes'] extends {
            precheckAllowResultSchema: infer Schema;
          }
            ? Schema extends z.ZodType
              ? z.infer<Schema>
              : never
            : never;
        };
      };
      deniedPolicy?: never;
    }
  | {
      allow: false;
      deniedPolicy: {
        runtimeError?: string;
        packageName: keyof Policies;
        result:
          | (Policies[Extract<keyof Policies, string>]['__schemaTypes'] extends {
              precheckDenyResultSchema: infer Schema;
            }
              ? Schema extends z.ZodType
                ? z.infer<Schema>
                : undefined
              : undefined)
          | undefined;
      };
      allowedPolicies?: {
        [PolicyKey in keyof Policies]?: {
          result: Policies[PolicyKey]['__schemaTypes'] extends {
            precheckAllowResultSchema: infer Schema;
          }
            ? Schema extends z.ZodType
              ? z.infer<Schema>
              : never
            : never;
        };
      };
    }
);
