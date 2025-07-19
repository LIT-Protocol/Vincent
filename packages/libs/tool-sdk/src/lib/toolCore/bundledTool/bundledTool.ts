// src/lib/toolCore/bundledTool/bundledTool.ts

import type { VincentTool } from '../../types';
import type { BundledVincentTool } from './types';

import { VINCENT_TOOL_API_VERSION } from '../../constants';

/** @hidden */
export function asBundledVincentTool<
  const VT extends VincentTool<any, any, any, any, any, any, any, any, any, any>,
  const IpfsCid extends string,
  const PackageName extends string,
>(
  vincentTool: VT,
  ipfsCid: IpfsCid,
  packageName: PackageName,
): BundledVincentTool<VT, { ipfsCid: IpfsCid; packageName: PackageName }> {
  const bundledTool = {
    metadata: {
      ipfsCid,
      packageName,
    },
    vincentTool,
  } as BundledVincentTool<VT, { ipfsCid: IpfsCid; packageName: PackageName }>;

  // Add non-enumerable 'magic' property
  Object.defineProperty(bundledTool, 'vincentToolApiVersion', {
    value: VINCENT_TOOL_API_VERSION,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  return bundledTool as BundledVincentTool<
    VT,
    { ipfsCid: IpfsCid; packageName: PackageName },
    typeof VINCENT_TOOL_API_VERSION
  >;
}
