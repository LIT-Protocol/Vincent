import { VersionParameter } from '@/types';

/**
 * Compares two arrays of VersionParameter objects to determine if they have the same values
 * This ignores array order and only compares the relevant parameter values
 *
 * @param existingParams - The original parameters
 * @param newParams - The updated parameters to compare against
 * @returns boolean - true if parameters are equivalent, false if there are changes
 */
export function areParametersEqual(
  existingParams: VersionParameter[],
  newParams: VersionParameter[],
): boolean {
  if (existingParams.length !== newParams.length) {
    return false;
  }

  const existingParamMap = new Map<string, any>();

  existingParams.forEach((param) => {
    const key = `${param.toolIndex}-${param.policyIndex}-${param.paramIndex}`;
    existingParamMap.set(key, param.value);
  });

  for (const param of newParams) {
    const key = `${param.toolIndex}-${param.policyIndex}-${param.paramIndex}`;
    const existingValue = existingParamMap.get(key);

    if (existingValue === undefined) {
      return false;
    }

    if (typeof param.value !== typeof existingValue) {
      return false;
    }

    if (typeof param.value === 'object') {
      if (JSON.stringify(param.value) !== JSON.stringify(existingValue)) {
        return false;
      }
    } else {
      if (param.value !== existingValue) {
        return false;
      }
    }
  }

  return true;
}
