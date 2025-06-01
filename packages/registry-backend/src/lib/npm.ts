import * as queryRegistry from 'query-registry';

// @ts-expect-error No types for this pkg
import normalizePackage from 'normalize-package-data';

const { getPackument } = queryRegistry;
export async function getPackageInfo({
  packageName,
  version,
}: {
  packageName: string;
  version: string;
}) {
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
