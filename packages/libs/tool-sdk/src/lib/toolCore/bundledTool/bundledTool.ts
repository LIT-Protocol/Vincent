// src/lib/toolCore/bundledTool/bundledTool.ts

import type { VincentTool } from '../../types';
import type { BundledVincentTool } from './types';

import { VINCENT_TOOL_API_VERSION } from '../../constants';

/** @hidden */
export function asBundledVincentTool<
  const VT extends VincentTool<any, any, any, any, any, any, any, any, any, any>,
  const IpfsCid extends string,
>(vincentTool: VT, ipfsCid: IpfsCid): BundledVincentTool<VT, IpfsCid> {
  const bundledTool = {
    ipfsCid,
    vincentTool,
  } as BundledVincentTool<VT, IpfsCid>;

  // Add non-enumerable 'magic' property
  Object.defineProperty(bundledTool, 'vincentToolApiVersion', {
    value: VINCENT_TOOL_API_VERSION,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  return bundledTool as BundledVincentTool<VT, IpfsCid, typeof VINCENT_TOOL_API_VERSION>;
}
