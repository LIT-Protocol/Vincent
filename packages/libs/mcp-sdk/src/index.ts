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
  VincentAppDefSchema,
  VincentAppToolsSchema,
  VincentToolDefSchema,
  VincentToolNpmSchema,
} from './definitions';
import type {
  VincentAppDef,
  VincentAppTools,
  VincentParameter,
  VincentToolDef,
  VincentToolNpm,
} from './definitions';
import { getVincentAppServer } from './server';

export type { VincentAppDef, VincentAppTools, VincentParameter, VincentToolDef, VincentToolNpm };
export {
  buildMcpToolName,
  getVincentAppServer,
  VincentAppDefSchema,
  VincentAppToolsSchema,
  VincentToolDefSchema,
  VincentToolNpmSchema,
};
