export default async function editVersion(appId: number, versionNumber: number, changes: string) {
  return {
    success: true,
    message: 'Version updated successfully',
  };
}
