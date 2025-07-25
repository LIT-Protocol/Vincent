import { exec } from 'node:child_process';
import util from 'node:util';
import * as os from 'os';
import * as path from 'path';

const execAsync = util.promisify(exec);

import { mkdtemp, mkdir } from 'node:fs/promises';

import { remove, readJSON } from 'fs-extra';
import * as tar from 'tar';

import { Policy, PolicyVersion } from './mongo/policy';

// Module-level verbose logging control
// const ENABLE_VERBOSE_LOGGING = process.env.VINCENT_VERBOSE_LOGGING === 'true' || false;
const ENABLE_VERBOSE_LOGGING = false;

/**
 * Debug logging utility
 */
function debugLog(message: string, data?: any): void {
  if (ENABLE_VERBOSE_LOGGING) {
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG ${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

/**
 * Metadata extracted from a package
 */
export interface PackageMetadata {
  /**
   * IPFS CID of the package
   */
  ipfsCid: string;

  /**
   * Additional metadata for policies
   */
  uiSchema?: Record<string, unknown>;
  jsonSchema?: Record<string, unknown>;
}

/**
 * Options for importing a package
 */
export interface ImportPackageOptions {
  /**
   * Package name
   */
  packageName: string;

  /**
   * Package version
   */
  version: string;

  /**
   * Type of package (tool or policy)
   */
  type: 'tool' | 'policy';
}

/**
 * Creates a temporary directory
 * @returns Path to the temporary directory
 */
async function createTempDir(): Promise<string> {
  debugLog('Creating temporary directory');
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'vincent-package-'));
  debugLog('Temporary directory created', { tempDir });
  return tempDir;
}

/**
 * Cleans up a temporary directory
 * @param tempDir Path to the temporary directory
 */
async function cleanupTempDir(tempDir: string): Promise<void> {
  debugLog('Cleaning up temporary directory', { tempDir });
  try {
    await remove(tempDir);
    debugLog('Temporary directory cleaned up successfully', { tempDir });
  } catch (error) {
    debugLog('Error cleaning up temporary directory', { tempDir, error: (error as Error).message });
    console.error(`Error cleaning up temporary directory ${tempDir}:`, error);
  }
}

/**
 * Downloads and extracts a package using npm pack
 * @param packageName Package name
 * @param version Package version
 * @param tempDir Temporary directory to store the package
 * @returns Path to the extracted package
 */
async function downloadAndExtractPackage(
  packageName: string,
  version: string,
  tempDir: string,
): Promise<string> {
  debugLog('Starting package download and extraction', { packageName, version, tempDir });

  try {
    // Run npm pack to download the package
    debugLog('Running npm pack', { packageName, version, tempDir });

    const { stdout } = await execAsync(
      `npm pack ${packageName}@${version} --pack-destination ${tempDir}`,
    );

    const tarballName = stdout.trim();
    const tarballPath = path.join(tempDir, tarballName);

    debugLog('npm pack completed', { tarballName, tarballPath });

    // Create a directory to extract the package to
    const extractDir = path.join(tempDir, 'extracted');
    debugLog('Creating extraction directory', { extractDir });
    await mkdir(extractDir);

    // Extract the tarball
    debugLog('Extracting tarball', { tarballPath, extractDir });
    await tar.extract({
      file: tarballPath,
      cwd: extractDir,
      strip: 1, // Remove the package directory from the paths
    });

    debugLog('Package extraction completed successfully', { extractDir });
    return extractDir;
  } catch (error) {
    debugLog('Failed to download and extract package', {
      packageName,
      version,
      error: (error as Error).message,
    });
    throw new Error(
      `Failed to download and extract package ${packageName}@${version}: ${(error as Error).message}`,
    );
  }
}

/**
 * Reads metadata from a package
 * @param packageDir Path to the extracted package
 * @param type Type of package (tool or policy)
 * @returns Package metadata
 */
async function readPackageMetadata(
  packageDir: string,
  type: 'tool' | 'policy',
): Promise<PackageMetadata> {
  debugLog('Reading package metadata', { packageDir, type });

  const metadataFileName =
    type === 'tool' ? 'vincent-tool-metadata.json' : 'vincent-policy-metadata.json';
  const metadataPath = path.join(packageDir, 'dist/src/generated/', metadataFileName);

  debugLog('Metadata file path determined', { metadataFileName, metadataPath });

  try {
    debugLog('Reading metadata file');
    const metadata = await readJSON(metadataPath, 'utf-8');
    debugLog(`Metadata file read successfully from ${metadataPath}`);

    if (!metadata.ipfsCid) {
      debugLog('Missing ipfsCid in metadata', { metadata });
      throw new Error(`Missing required property 'ipfsCid' in ${metadataFileName}`);
    }

    debugLog('Package metadata validation successful', { ipfsCid: metadata.ipfsCid });
    return metadata;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      debugLog('Metadata file not found', { metadataPath });
      throw new Error(`Metadata file ${metadataFileName} not found in package`);
    }
    debugLog('Failed to read or parse metadata', {
      metadataPath,
      error: (error as Error).message,
    });
    throw new Error(
      `Failed to read metadata from ${metadataFileName}: ${(error as Error).message}`,
    );
  }
}

/**
 * Identifies supported policies from dependencies
 * @param dependencies Dependencies object from package.json
 * @returns Object containing supportedPolicies and policiesNotInRegistry arrays
 */
export async function identifySupportedPolicies(dependencies: Record<string, string>): Promise<{
  supportedPolicies: Record<string, string>;
  policiesNotInRegistry: string[];
}> {
  debugLog('Identifying supported policies from dependencies', {
    dependenciesCount: Object.keys(dependencies).length,
  });

  const supportedPolicies: Record<string, string> = {};
  const policiesNotInRegistry: string[] = [];

  // Filter out dependencies with non-explicit semvers
  const explicitDependencies = Object.entries(dependencies).filter(
    ([_, version]) =>
      !version.startsWith('^') &&
      !version.startsWith('~') &&
      !version.includes('*') &&
      !version.includes('>') &&
      !version.includes('<'),
  );

  if (explicitDependencies.length === 0) {
    debugLog('No dependencies with explicit semvers found');
    return { supportedPolicies, policiesNotInRegistry };
  }

  // Extract package names for batch query
  const packageNames = explicitDependencies.map(([packageName]) => packageName);

  // Batch query to find all policies with matching package names
  const policies = await Policy.find({
    packageName: { $in: packageNames }, // Limit: 16MB of packageNames
    isDeleted: false,
  }).lean();

  if (policies.length === 0) {
    debugLog('No policies found for any dependencies');
    return { supportedPolicies, policiesNotInRegistry };
  }

  // Create a map of package names to versions for quick lookup
  const dependencyVersions = new Map(explicitDependencies);

  // Create a set of policy package names for quick lookup
  const policyPackageNames = new Set(policies.map((policy) => policy.packageName));

  // Create an array of packageName/version pairs for batch query
  const policyVersionQueries = explicitDependencies
    .filter(([packageName]) => policyPackageNames.has(packageName))
    .map(([packageName, version]) => ({
      packageName,
      version,
      isDeleted: false,
    }));

  if (policyVersionQueries.length === 0) {
    debugLog('No dependencies match any policies');
    return { supportedPolicies, policiesNotInRegistry };
  }

  // Batch query to find all policy versions with matching package names and versions
  const policyVersions = await PolicyVersion.find({ $or: policyVersionQueries }).lean();

  // Create a set of packageName@version strings for quick lookup
  const policyVersionSet = new Set(policyVersions.map((pv) => `${pv.packageName}@${pv.version}`));

  // Process each policy package
  for (const packageName of policyPackageNames) {
    const version = dependencyVersions.get(packageName);
    if (!version) continue; // Make TypeScript happy <3 :)

    const versionKey = `${packageName}@${version}`;

    if (policyVersionSet.has(versionKey)) {
      // If PolicyVersion exists, add to supportedPolicies
      debugLog('Found matching PolicyVersion, adding to supportedPolicies', {
        packageName,
        version,
      });
      supportedPolicies[packageName] = version;
    } else {
      // If Policy exists but PolicyVersion doesn't, add to policiesNotInRegistry
      debugLog('Policy exists but no matching PolicyVersion found', { packageName, version });
      policiesNotInRegistry.push(versionKey);
    }
  }

  debugLog('Completed identifying supported policies', {
    supportedPoliciesCount: supportedPolicies.length,
    policiesNotInRegistryCount: policiesNotInRegistry.length,
  });

  return { supportedPolicies, policiesNotInRegistry };
}

/**
 * Imports a package and extracts its metadata
 * @param options Import options
 * @returns Package metadata
 */
export async function importPackage(options: ImportPackageOptions): Promise<PackageMetadata> {
  const { packageName, version, type } = options;
  debugLog('Starting package import', { packageName, version, type });

  // Create a temporary directory
  const tempDir = await createTempDir();

  try {
    // Download and extract the package
    const packageDir = await downloadAndExtractPackage(packageName, version, tempDir);

    // Read the metadata from the package
    const metadata = await readPackageMetadata(packageDir, type);

    debugLog('Package import completed successfully', {
      packageName,
      version,
      type,
      ipfsCid: metadata.ipfsCid,
    });

    return metadata;
  } catch (error) {
    debugLog('Package import failed', {
      packageName,
      version,
      type,
      error: (error as Error).message,
    });
    throw error;
  } finally {
    // Always clean up the temporary directory, even if an error occurs
    await cleanupTempDir(tempDir);
  }
}
