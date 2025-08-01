import { major } from 'semver';

import { VINCENT_TOOL_API_VERSION } from './constants';

export function assertSupportedAbilityVersion(
  abilityVersionSemver: string | undefined,
): asserts abilityVersionSemver is string {
  if (!abilityVersionSemver) {
    throw new Error('Ability version is required');
  }

  // Check if the ability's API version has the same major version as the current API version
  if (major(abilityVersionSemver) !== major(VINCENT_TOOL_API_VERSION)) {
    throw new Error(
      `Ability version ${abilityVersionSemver} is not supported. Current version: ${VINCENT_TOOL_API_VERSION}. Major versions must match.`,
    );
  }
}
