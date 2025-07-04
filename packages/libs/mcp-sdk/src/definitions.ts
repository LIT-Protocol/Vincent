/**
 * Type definitions and utilities for Vincent MCP applications
 *
 * This module provides type definitions and utility functions for working with
 * Vincent applications that integrate with the Model Context Protocol.
 *
 * @module mcp/definitions
 * @category Vincent MCP SDK
 */

import { z } from 'zod';

/**
 * Builds a unique tool name for use in the MCP.
 *
 * The name is composed of the tool name, the Vincent application name, and the
 * application version. The total length is capped at 64 characters to ensure
 * compatibility with various systems. Invalid characters are replaced with hyphens.
 *
 * @param vincentAppDef - The Vincent application definition.
 * @param toolName - The name of the tool.
 * @returns A unique, sanitized tool name.
 */
export function buildMcpToolName(vincentAppDef: VincentAppDef, toolName: string) {
  return `${toolName}/${vincentAppDef.name}/${vincentAppDef.version}`
    .replace(/[^a-zA-Z0-9@&/_.-]/g, '-')
    .substring(0, 64);
}

/**
 * Zod schema for validating Vincent parameter definitions
 *
 * This schema defines the structure of a parameter in a Vincent tool.
 */
export const VincentParameterSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
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
  name: z.string().optional(),
  description: z.string().optional(),
  parameters: z.array(VincentParameterSchema).optional(),
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
 * Zod schema for validating Vincent tool definitions published in an NPM package
 *
 * This schema defines the structure of a tool in a NPM package.
 */
export const VincentToolNpmSchema = VincentToolDefSchema.extend({
  version: z.string(),
});

/**
 * Type representing a tool in a NPM package
 *
 * @property version - The version of the tool
 */
export type VincentToolNpm = z.infer<typeof VincentToolNpmSchema>;

/**
 * Zod schema for validating a collection of Vincent application tools.
 *
 * This schema defines the structure for a record of tools, where each key
 * is a tool identifier and the value is a valid VincentToolNpm object.
 */
export const VincentAppToolsSchema = z.record(VincentToolNpmSchema);

/**
 * Type representing a collection of tools in a Vincent application.
 *
 * This is a record where keys are tool npm package names and
 * values are `VincentToolNpm` objects.
 */
export type VincentAppTools = z.infer<typeof VincentAppToolsSchema>;

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
  tools: VincentAppToolsSchema,
});

/**
 * Type representing a Vincent application
 *
 * @property id - The unique identifier of the application
 * @property name - The name of the application
 * @property version - The version of the application
 * @property tools - A record of tools in the application, where the key is the tool's npm package name
 */
export type VincentAppDef = z.infer<typeof VincentAppDefSchema>;
