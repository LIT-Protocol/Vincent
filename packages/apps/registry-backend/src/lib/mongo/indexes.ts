// PolicyVersions and AbilityVersions are NPM package versions; we want 1 doc per package name and version combo
export const uniquePackageVersion = [{ packageName: 1, version: 1 }, { unique: true }] as const;

// Optimizes performance when finding groups of specific packageName + versions that are not deleted - isDeleted being first is _INTENTIONAL_.
export const undeletedByPackageIdentity = [{ isDeleted: 1, packageName: 1, version: 1 }] as const;

// Optimizes performance when scanning for policies that are undeleted - isDeleted being first is _INTENTIONAL_.
export const undeletedByPackageName = [{ isDeleted: 1, packageName: 1 }] as const;
