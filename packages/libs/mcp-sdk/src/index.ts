/** Vincent Model Context Protocol (MCP) integration
 *
 * This module provides types and utilities for working with Vincent applications
 * that you want to expose to AI systems using the Model Context Protocol.
 *
 * @module mcp
 * @category Vincent MCP SDK
 */

import {
  buildMcpToolName,
  buildMcpParamDefinitions,
  buildMcpToolCallback,
  buildVincentToolCallback,
  VincentAppDefSchema,
  VincentToolDefSchema,
} from './definitions';
import type {
  ParameterType,
  VincentAppDef,
  VincentParameter,
  VincentToolDef,
  VincentToolDefWithIPFS,
} from './definitions';
import { getVincentAppServer } from './server';

export type {
  ParameterType,
  VincentAppDef,
  VincentParameter,
  VincentToolDef,
  VincentToolDefWithIPFS,
};
export {
  buildMcpToolName,
  buildMcpParamDefinitions,
  buildMcpToolCallback,
  buildVincentToolCallback,
  getVincentAppServer,
  VincentAppDefSchema,
  VincentToolDefSchema,
};
