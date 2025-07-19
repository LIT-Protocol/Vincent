import { major } from 'semver';

import { VINCENT_TOOL_API_VERSION } from './constants';

export function assertSupportedToolVersion(
  toolVersionSemver: string | undefined,
): asserts toolVersionSemver is string {
  if (!toolVersionSemver) {
    throw new Error('Tool version is required');
  }

  // Check if the tool's API version has the same major version as the current API version
  if (major(toolVersionSemver) !== major(VINCENT_TOOL_API_VERSION)) {
    throw new Error(
      `Tool version ${toolVersionSemver} is not supported. Current version: ${VINCENT_TOOL_API_VERSION}. Major versions must match.`,
    );
  }
}
