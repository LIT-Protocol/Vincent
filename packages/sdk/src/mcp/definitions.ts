/**
 * Type definitions and utilities for Vincent MCP applications
 *
 * This module provides type definitions and utility functions for working with
 * Vincent applications that integrate with the Model Context Protocol.
 *
 * @module mcp/definitions
 * @category Vincent SDK API
 */

import { z, ZodRawShape } from 'zod';

/**
 * Supported parameter types for Vincent tool parameters
 *
 * These types define the valid parameter types that can be used in Vincent tool definitions.
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
 * Type representing the supported parameter types for Vincent tool parameters
 * @see {@link ParameterType} for the list of supported types
 */
export type ParameterType = z.infer<typeof ParameterTypeEnum>;

/**
 * Mapping of parameter types to their corresponding Zod validation schemas
 *
 * This map provides validation logic for each supported parameter type.
 * It is used by the buildParamDefinitions function to create Zod schemas for tool parameters.
 *
 * @internal
 */
const ZodSchemaMap: Record<ParameterType, z.ZodTypeAny> = {
  number: z.string().refine((val) => val === '' || val === '-' || !isNaN(parseInt(val)), {
    message: 'Must be a valid integer or empty',
  }),
  number_array: z.string().refine(
    (val) =>
      val === '' ||
      val.split(',').every((item) => {
        const trimmed = item.trim();
        return trimmed === '' || trimmed === '-' || !isNaN(parseInt(trimmed));
      }),
    {
      message: 'Must be comma-separated integers or empty',
    }
  ),
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
 * Builds Zod schema definitions for Vincent tool parameters
 *
 * This function takes an array of Vincent parameter definitions and creates a Zod schema
 * that can be used to validate tool inputs. Each parameter is mapped to its corresponding
 * validation schema from the ZodSchemaMap.
 *
 * @param params - Array of Vincent parameter definitions
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
 * const paramSchema = buildParamDefinitions(parameters);
 * const validationSchema = z.object(paramSchema);
 * ```
 */
export function buildParamDefinitions(params: VincentParameter[]) {
  return params.reduce((acc, param) => {
    const zodSchema = ZodSchemaMap[param.type] || z.string();
    acc[param.name] = zodSchema.describe(param.description);
    return acc;
  }, {} as ZodRawShape);
}

/**
 * Zod schema for validating Vincent parameter definitions
 *
 * This schema defines the structure of a parameter in a Vincent tool.
 */
export const VincentParameterSchema = z.object({
  name: z.string(),
  type: ParameterTypeEnum,
  description: z.string(),
});

/**
 * Type representing a parameter in a Vincent tool
 *
 * @property name - The name of the parameter
 * @property type - The type of the parameter (from ParameterType)
 * @property description - A description of the parameter
 */
export type VincentParameter = z.infer<typeof VincentParameterSchema>;

/**
 * Zod schema for validating Vincent tool definitions
 *
 * This schema defines the structure of a tool in a Vincent application.
 * @hidden
 */
export const VincentToolDefSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.array(VincentParameterSchema),
});

/**
 * Type representing a tool in a Vincent application
 *
 * @property name - The name of the tool
 * @property description - A description of the tool
 * @property parameters - An array of parameter definitions for the tool
 */
export type VincentToolDef = z.infer<typeof VincentToolDefSchema>;

/**
 * Type representing a tool in a Vincent application with its IPFS CID
 *
 * This extends VincentToolDef with an additional ipfsCid property.
 *
 * @property ipfsCid - The IPFS CID of the tool
 */
export type VincentToolDefWithIPFS = VincentToolDef & { ipfsCid: string };

/**
 * Zod schema for validating Vincent application definitions
 *
 * This schema defines the structure of a Vincent application.
 * @hidden
 */
export const VincentAppDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  tools: z.record(VincentToolDefSchema),
});

/**
 * Type representing a Vincent application
 *
 * @property id - The unique identifier of the application
 * @property name - The name of the application
 * @property version - The version of the application
 * @property tools - A record of tools in the application, where the key is the IPFS CID of the tool
 */
export type VincentAppDef = z.infer<typeof VincentAppDefSchema>;
