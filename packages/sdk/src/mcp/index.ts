/** Vincent Model Context Protocol (MCP) integration
 *
 * This module provides types and utilities for working with Vincent applications
 * that you want to expose to AI systems using the Model Context Protocol.
 *
 * @module mcp
 * @category Vincent SDK API
 */

import {
  buildParamDefinitions,
  buildVincentActionCallback,
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
  buildParamDefinitions,
  buildVincentActionCallback,
  getVincentAppServer,
  VincentAppDefSchema,
  VincentToolDefSchema,
};
