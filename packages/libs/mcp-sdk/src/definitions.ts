/**
 * Type definitions and utilities for Vincent MCP applications
 *
 * This module provides type definitions and utility functions for working with
 * Vincent applications that integrate with the Model Context Protocol.
 *
 * @module mcp/definitions
 * @category Vincent MCP SDK
 */

import {
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitActionResource,
  LitPKPResource,
} from '@lit-protocol/auth-helpers';
import { LIT_ABILITY } from '@lit-protocol/constants';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import {
  CallToolResult,
  ServerRequest,
  ServerNotification,
} from '@modelcontextprotocol/sdk/types.js';
import { ethers, Signer } from 'ethers';
import { z, type ZodRawShape } from 'zod';

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
export function buildParamDefinitions(params: VincentParameter[]): ZodRawShape {
  const zodSchema = {} as ZodRawShape;

  // Always add the delegator PKP Eth address
  zodSchema['pkpEthAddress'] = z
    .string()
    .describe(
      "The delegator's PKP address that will execute the swap. For example 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045."
    );

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

// TODO this is likely duplicated. If not should be moved somewhere to be reused
const generateSessionSigs = async ({
  litNodeClient,
  ethersSigner,
}: {
  litNodeClient: LitNodeClient;
  ethersSigner: ethers.Signer;
}) => {
  return litNodeClient.getSessionSigs({
    chain: 'ethereum',
    resourceAbilityRequests: [
      { resource: new LitPKPResource('*'), ability: LIT_ABILITY.PKPSigning },
      { resource: new LitActionResource('*'), ability: LIT_ABILITY.LitActionExecution },
    ],
    authNeededCallback: async ({ resourceAbilityRequests, uri }) => {
      const [walletAddress, nonce] = await Promise.all([
        ethersSigner.getAddress(),
        litNodeClient.getLatestBlockhash(),
      ]);

      const toSign = await createSiweMessageWithRecaps({
        uri: uri || 'http://localhost:3000',
        expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
        resources: resourceAbilityRequests || [],
        walletAddress,
        nonce,
        litNodeClient,
      });

      return await generateAuthSig({ signer: ethersSigner, toSign });
    },
  });
};

export function buildMcpToolName(vincentAppDef: VincentAppDef, toolName: string) {
  return `${vincentAppDef.name.toLowerCase().replace(' ', '-')}-V${vincentAppDef.version}-${toolName}`;
}

// TODO CB AG really needs a function that returns an object. Refactor buildToolCallback to coexist with this in a safe parsing way
// export function buildVincentActionCallback() {}

/**
 * Creates a callback function for handling tool execution requests
 *
 * @param litNodeClient - The Lit Node client used to execute the tool
 * @param delegateeSigner - The Ethereum signer used to execute the tool
 * @param vincentToolDefWithIPFS - The tool definition with its IPFS CID
 * @returns A callback function that executes the tool with the provided arguments
 * @internal
 */
export function buildToolCallback(
  litNodeClient: LitNodeClient,
  delegateeSigner: Signer,
  vincentToolDefWithIPFS: VincentToolDefWithIPFS
) {
  // const vincentToolCallback = buildVincentActionCallback(vincentToolDefWithIPFS);

  return async (
    args: ZodRawShape,
    _extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ): Promise<CallToolResult> => {
    // const response = await vincentToolCallback(delegateeSigner, args);
    const sessionSigs = await generateSessionSigs({ ethersSigner: delegateeSigner, litNodeClient });
    const result = await litNodeClient.executeJs({
      ipfsId: vincentToolDefWithIPFS.ipfsCid,
      sessionSigs,
      jsParams: {
        toolParams: args,
        context: {
          delegatorPkpEthAddress: args.pkpEthAddress,
        },
      },
    });

    const success = result.success;
    if (!success) {
      throw new Error(JSON.stringify(result, null, 2));
    }

    let response = result.response;
    if (typeof response === 'string') {
      try {
        response = JSON.parse(response);
      } catch {
        // keep the original response
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success, response }),
        },
      ],
    };
  };
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
  optional: z.boolean().default(false),
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
 */
export const VincentAppDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
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
