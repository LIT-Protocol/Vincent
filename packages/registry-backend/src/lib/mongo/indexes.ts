// Policy and Tools are NPM packages; we want 1 doc per package name.
export const uniquePackageName = [{ packageName: 1 }, { unique: true }] as const;

// PolicyVersions and ToolVersions are NPM package versions; we want 1 doc per package name and version combo
export const uniquePackageVersion = [{ packageName: 1, version: 1 }, { unique: true }] as const;
