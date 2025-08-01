import normalizePackage from 'normalize-package-data';
import * as queryRegistry from 'query-registry';
import { valid, clean } from 'semver';
// @ts-expect-error no types for this pkg
import validatePackageName from 'validate-npm-package-name';

const { getPackument } = queryRegistry;

/**
 * Validates an NPM package name
 * @param packageName The package name to validate
 * @throws Error if the package name is invalid
 */
export function validateNpmPackageName(packageName: string): void {
  const result = validatePackageName(packageName);
  if (!result.validForNewPackages) {
    const errors = result.errors || [];
    const warnings = result.warnings || [];
    const messages = [...errors, ...warnings];
    throw new Error(`Invalid NPM package name: ${packageName}. ${messages.join(', ')}`);
  }
}

/**
 * Validates a semantic version string
 * @param version The version string to validate
 * @throws Error if the version is not a valid semver or contains range modifiers
 */
export function validateSemver(version: string): void {
  // Check if it's a valid semver
  if (!valid(version)) {
    throw new Error(`Invalid semantic version: ${version}. Must be a valid semver (e.g., 1.0.0).`);
  }

  // Check for range modifiers by comparing the cleaned version with the original
  // If they're different, it means the original had range modifiers
  if (version !== clean(version)) {
    throw new Error(
      `Invalid semantic version: ${version}. Version must be explicit and Invalid semantic version (^, ~, >, <, etc.).`,
    );
  }

  // Additional check to ensure no range syntax is used
  if (/[\^~><= ]/.test(version)) {
    throw new Error(
      `Invalid semantic version: ${version}. Version must be explicit and Invalid semantic version (^, ~, >, <, etc.).`,
    );
  }
}

export async function getPackageInfo({
  packageName,
  version,
}: {
  packageName: string;
  version: string;
}) {
  // Validate inputs before making the request
  validateNpmPackageName(packageName);
  validateSemver(version);

  try {
    const packument = await getPackument(packageName);

    const targetVersion = packument.versions[version];

    if (!targetVersion) {
      throw new Error(`Could not find ${packageName}@${version} on NPM`);
    }

    normalizePackage(targetVersion, true);

    return targetVersion;
  } catch (e) {
    throw new Error(`Could not find package ${packageName} on NPM: ${(e as Error).message}`);
  }
}
