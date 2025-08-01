/** Vincent Model Context Protocol (MCP) integration
 *
 * This module provides types and utilities for working with Vincent applications
 * that you want to expose to AI systems using the Model Context Protocol.
 *
 * @module mcp
 * @category Vincent MCP SDK
 */

import {
  buildMcpAbilityName,
  buildMcpParamDefinitions,
  buildMcpAbilityCallback,
  buildVincentAbilityCallback,
  VincentAppDefSchema,
  VincentAbilityDefSchema,
} from './definitions';
import type {
  ParameterType,
  VincentAppDef,
  VincentParameter,
  VincentAbilityDef,
  VincentAbilityDefWithIPFS,
} from './definitions';
import { getVincentAppServer } from './server';

export type {
  ParameterType,
  VincentAppDef,
  VincentParameter,
  VincentAbilityDef,
  VincentAbilityDefWithIPFS,
};
export {
  buildMcpAbilityName,
  buildMcpParamDefinitions,
  buildMcpAbilityCallback,
  buildVincentAbilityCallback,
  getVincentAppServer,
  VincentAppDefSchema,
  VincentAbilityDefSchema,
};
