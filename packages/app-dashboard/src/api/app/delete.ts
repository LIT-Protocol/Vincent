export default async function deleteApp(appId: number): Promise<void> {
  const key = `app: ${appId}`;
  console.log('Deleting app', key);
  localStorage.removeItem(key);
}
