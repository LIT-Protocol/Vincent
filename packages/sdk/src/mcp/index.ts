/** Vincent Model Context Protocol (MCP) integration
 *
 * This module provides types and utilities for working with Vincent applications
 * that you want to expose to AI systems using the Model Context Protocol.
 *
 * @module mcp
 * @category Vincent SDK API
 */

import {
  VincentAppDef,
  VincentAppDefSchema,
  VincentToolDef,
  VincentToolDefSchema,
} from './definitions';
import { getVincentAppServer } from './server';

export {
  VincentAppDef,
  VincentAppDefSchema,
  VincentToolDef,
  VincentToolDefSchema,
  getVincentAppServer,
};
