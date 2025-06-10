export interface VincentAppInfo {
  appId: number;
  appVersion: number;
}

export interface VincentAppPolicy {
  ipfsCid: string;
  parameterNames: string[];
  parameterTypes: number[];
}

export interface VincentAppToolsWithPolicies {
  ipfsCid: string;
  policies: VincentAppPolicy[];
}

// Enums matching the contract definitions
export enum VINCENT_APP_PARAMETER_TYPE {
  INT256 = 0,
  INT256_ARRAY = 1,
  UINT256 = 2,
  UINT256_ARRAY = 3,
  BOOL = 4,
  BOOL_ARRAY = 5,
  ADDRESS = 6,
  ADDRESS_ARRAY = 7,
  STRING = 8,
  STRING_ARRAY = 9,
  BYTES = 10,
  BYTES_ARRAY = 11,
}
