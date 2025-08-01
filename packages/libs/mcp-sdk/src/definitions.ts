/**
 * Type definitions and utilities for Vincent MCP applications
 *
 * This module provides type definitions and utility functions for working with
 * Vincent applications that integrate with the Model Context Protocol.
 *
 * @module mcp/definitions
 * @category Vincent MCP SDK
 */

import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { generateVincentAbilitySessionSigs } from '@lit-protocol/vincent-app-sdk/abilityClient';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {
  CallToolResult,
  ServerRequest,
  ServerNotification,
} from '@modelcontextprotocol/sdk/types.js';
import { Signer } from 'ethers';
import { z, type ZodRawShape } from 'zod';

/**
 * Supported parameter types for Vincent ability parameters
 *
 * These types define the valid parameter types that can be used in Vincent ability definitions.
 * Each type has corresponding validation logic in the ZodSchemaMap.
 */
const ParameterType = [
  'number',
  'number_array',
  'bool',
  'bool_array',
  'address',
  'address_array',
  'string',
  'string_array',
  'bytes',
  'bytes_array',
] as const;
const ParameterTypeEnum = z.enum(ParameterType);

/**
 * Type representing the supported parameter types for Vincent ability parameters
 * @see {@link ParameterType} for the list of supported types
 */
export type ParameterType = z.infer<typeof ParameterTypeEnum>;

/**
 * Mapping of parameter types to their corresponding Zod validation schemas
 *
 * This map provides validation logic for each supported parameter type.
 * It is used by the buildMcpParamDefinitions function to create Zod schemas for ability parameters.
 *
 * @internal
 */
const ZodSchemaMap: Record<ParameterType, z.ZodTypeAny> = {
  number: z.coerce.number(),
  number_array: z.coerce.number().array(),
  bool: z.boolean(),
  bool_array: z.string().refine(
    (val) =>
      val === '' ||
      val.split(',').every((item) => {
        const trimmed = item.trim().toLowerCase();
        return (
          trimmed === '' || ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(trimmed)
        );
      }),
    {
      message: 'Must be comma-separated boolean values or empty',
    }
  ),
  address: z.string().regex(/^(0x[a-fA-F0-9]{40}|0x\.\.\.|)$/, {
    message: 'Must be a valid Ethereum address, 0x..., or empty',
  }),
  address_array: z.string().refine(
    (val) =>
      val === '' ||
      val.split(',').every((item) => {
        const trimmed = item.trim();
        return trimmed === '' || trimmed === '0x...' || /^0x[a-fA-F0-9]{40}$/.test(trimmed);
      }),
    {
      message: 'Must be comma-separated Ethereum addresses or empty',
    }
  ),
  string: z.string(),
  string_array: z.string(),
  bytes: z.string(),
  bytes_array: z.string(),
} as const;

/**
 * Builds Zod schema definitions for Vincent ability parameters
 *
 * This function takes an array of Vincent parameter definitions and creates a Zod schema
 * that can be used to validate ability inputs. Each parameter is mapped to its corresponding
 * validation schema from the ZodSchemaMap.
 *
 * @param params - Array of Vincent parameter definitions
 * @param addDelegatorPkpAddress - Whether to add the delegator eth address as a param
 * @returns A Zod schema shape that can be used to create a validation schema
 *
 * @example
 * ```typescript
 * const parameters: VincentParameter[] = [
 *   {
 *     name: 'address',
 *     type: 'address',
 *     description: 'Ethereum address'
 *   },
 *   {
 *     name: 'amount',
 *     type: 'number',
 *     description: 'Amount to transfer'
 *   }
 * ];
 *
 * const paramSchema = buildMcpParamDefinitions(parameters);
 * const validationSchema = z.object(paramSchema);
 * ```
 */
export function buildMcpParamDefinitions(
  params: VincentParameter[],
  addDelegatorPkpAddress: boolean
): ZodRawShape {
  const zodSchema = {} as ZodRawShape;

  // Add the delegator PKP Eth address as a param. Delegatee is using the MCP and must specify which delegator to execute abilities for
  if (addDelegatorPkpAddress) {
    zodSchema['pkpEthAddress'] = z
      .string()
      .describe(
        "The delegator's PKP address. The delegatee executes this ability on behalf of this delegator. Any PKP signing will be done by this delegator PKP. For example 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045."
      );
  }

  // Add the rest of the parameters
  params.forEach((param) => {
    let paramZodSchema = ZodSchemaMap[param.type] || z.string();
    if (param.optional) {
      paramZodSchema = paramZodSchema.optional();
    }
    zodSchema[param.name] = paramZodSchema.describe(param.description);
  });

  return zodSchema;
}

export function buildMcpAbilityName(vincentAppDef: VincentAppDef, abilityName: string) {
  return `${vincentAppDef.name.toLowerCase().replace(' ', '-')}-V${vincentAppDef.version}-${abilityName}`;
}

/**
 * Creates a IPFS CID based Vincent Ability callback function to use in other contexts such as Agent Kits
 *
 * @param litNodeClient - The Lit Node client used to execute the ability
 * @param delegateeSigner - The delegatee signer used to trigger the ability
 * @param delegatorPkpEthAddress - The delegator to execute the ability in behalf of
 * @param vincentAbilityDefWithIPFS - The ability definition with its IPFS CID
 * @returns A callback function that executes the ability with the provided arguments
 * @internal
 */
export function buildVincentAbilityCallback(
  litNodeClient: LitNodeClient,
  delegateeSigner: Signer,
  delegatorPkpEthAddress: string | undefined,
  vincentAbilityDefWithIPFS: VincentAbilityDefWithIPFS
) {
  return async (
    args: ZodRawShape,
    _extra?: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<{ success: boolean; error?: string; result?: object }> => {
    try {
      const sessionSigs = await generateVincentAbilitySessionSigs({
        ethersSigner: delegateeSigner,
        litNodeClient,
      });
      const { pkpEthAddress, ...abilityParams } = args;
      const executeJsResponse = await litNodeClient.executeJs({
        ipfsId: vincentAbilityDefWithIPFS.ipfsCid,
        sessionSigs,
        jsParams: {
          abilityParams,
          context: {
            delegatorPkpEthAddress: delegatorPkpEthAddress || pkpEthAddress,
          },
        },
      });

      const executeJsSuccess = executeJsResponse.success || false;
      if (!executeJsSuccess) {
        throw new Error(JSON.stringify(executeJsResponse, null, 2));
      }

      const abilityExecutionResponse = JSON.parse(executeJsResponse.response as string);
      const { abilityExecutionResult } = abilityExecutionResponse;
      const { success, error, result } = abilityExecutionResult;

      return { success, error, result };
    } catch (e) {
      const error = `Could not successfully execute Vincent Ability. Reason (${(e as Error).message})`;
      return { success: false, error };
    }
  };
}

/**
 * Creates an MCP ability callback function for handling Vincent Ability execution requests
 * It is basically an MCP specific version wrapper of buildVincentAbilityCallback
 *
 * @param litNodeClient - The Lit Node client used to execute the ability
 * @param delegateeSigner - The delegatee signer used to trigger the ability
 * @param delegatorPkpEthAddress - The delegator to execute the ability in behalf of
 * @param vincentAbilityDefWithIPFS - The ability definition with its IPFS CID
 * @returns A callback function that executes the ability with the provided arguments
 * @internal
 */
export function buildMcpAbilityCallback(
  litNodeClient: LitNodeClient,
  delegateeSigner: Signer,
  delegatorPkpEthAddress: string | undefined,
  vincentAbilityDefWithIPFS: VincentAbilityDefWithIPFS
) {
  const vincentAbilityCallback = buildVincentAbilityCallback(
    litNodeClient,
    delegateeSigner,
    delegatorPkpEthAddress,
    vincentAbilityDefWithIPFS
  );

  return async (
    args: ZodRawShape,
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CallToolResult> => {
    const { success, error, result } = await vincentAbilityCallback(args, extra);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success, error, result }),
        },
      ],
    };
  };
}

/**
 * Zod schema for validating Vincent parameter definitions
 *
 * This schema defines the structure of a parameter in a Vincent ability.
 */
export const VincentParameterSchema = z.object({
  name: z.string(),
  type: ParameterTypeEnum,
  description: z.string(),
  optional: z.boolean().default(false).optional(),
});

/**
 * Type representing a parameter in a Vincent ability
 *
 * @property name - The name of the parameter
 * @property type - The type of the parameter (from ParameterType)
 * @property description - A description of the parameter
 */
export type VincentParameter = z.infer<typeof VincentParameterSchema>;

/**
 * Zod schema for validating Vincent ability definitions
 *
 * This schema defines the structure of an ability in a Vincent application.
 */
export const VincentAbilityDefSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.array(VincentParameterSchema),
});

/**
 * Type representing an ability in a Vincent application
 *
 * @property name - The name of the ability
 * @property description - A description of the ability
 * @property parameters - An array of parameter definitions for the ability
 */
export type VincentAbilityDef = z.infer<typeof VincentAbilityDefSchema>;

/**
 * Type representing an ability in a Vincent application with its IPFS CID
 *
 * This extends VincentAbilityDef with an additional ipfsCid property.
 *
 * @property ipfsCid - The IPFS CID of the ability
 */
export type VincentAbilityDefWithIPFS = VincentAbilityDef & { ipfsCid: string };

/**
 * Zod schema for validating Vincent application definitions
 *
 * This schema defines the structure of a Vincent application.
 */
export const VincentAppDefSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  version: z.number(),
  abilities: z.record(VincentAbilityDefSchema),
});

/**
 * Type representing a Vincent application
 *
 * @property id - The unique identifier of the application
 * @property name - The name of the application
 * @property version - The version of the application
 * @property abilities - A record of abilities in the application, where the key is the IPFS CID of the ability
 */
export type VincentAppDef = z.infer<typeof VincentAppDefSchema>;
