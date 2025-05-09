export default async function disableVersion(appId: number, versionNumber: number) {
  console.log('disableVersion', appId, versionNumber);
  return {
    success: true,
    message: 'Version disabled successfully',
  };
}
