// src/lib/toolClient/precheck/types.ts

import type { z } from 'zod';

import type { VincentPolicy } from '@lit-protocol/vincent-tool-sdk/internal';
import type { BaseToolContext } from '@lit-protocol/vincent-tool-sdk';

/* eslint-disable @typescript-eslint/no-unsafe-function-type */

/** @category Interfaces */
export interface ToolPrecheckResponseSuccess<Result, Policies extends Record<string, any>> {
  success: true;
  result: Result;
  context?: BaseToolContext<PolicyPrecheckResultContext<Policies>>;
}

/** @category Interfaces */
export interface ToolPrecheckResponseSuccessNoResult<Policies extends Record<string, any>> {
  success: true;
  result?: never;
  context?: BaseToolContext<PolicyPrecheckResultContext<Policies>>;
}

/** @category Interfaces */
export interface ToolPrecheckResponseFailure<Result, Policies extends Record<string, any>> {
  success: false;
  error?: string;
  result: Result;
  context?: BaseToolContext<PolicyPrecheckResultContext<Policies>>;
}

/** @category Interfaces */
export interface ToolPrecheckResponseFailureNoResult<Policies extends Record<string, any>> {
  success: false;
  error?: string;
  result?: never;
  context?: BaseToolContext<PolicyPrecheckResultContext<Policies>>;
}

/** @category Interfaces */
export type ToolPrecheckResponse<
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
  Policies extends Record<string, any>,
> =
  | (SuccessSchema extends z.ZodType
      ? ToolPrecheckResponseSuccess<z.infer<SuccessSchema>, Policies>
      : ToolPrecheckResponseSuccessNoResult<Policies>)
  | (FailSchema extends z.ZodType
      ? ToolPrecheckResponseFailure<z.infer<FailSchema>, Policies>
      : ToolPrecheckResponseFailureNoResult<Policies>);

export interface RemoteVincentToolExecutionResult<
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
  Policies extends Record<string, any>,
> {
  toolExecutionResult: ToolPrecheckResponse<SuccessSchema, FailSchema, Policies>;
  toolContext: BaseToolContext<PolicyPrecheckResultContext<Policies>>;
}

export type PolicyPrecheckResultContext<
  Policies extends Record<
    string,
    {
      vincentPolicy: VincentPolicy<any, any, any, any, any, any, any, any, any, any>;
      /** @hidden */
      __schemaTypes?: {
        policyToolParamsSchema: z.ZodType;
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
        error?: string;
        packageName: keyof Policies;
        result: Policies[Extract<keyof Policies, string>]['__schemaTypes'] extends {
          precheckDenyResultSchema: infer Schema;
        }
          ? Schema extends z.ZodType
            ? z.infer<Schema>
            : undefined
          : undefined;
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
