import { generateAppManagerJwt } from './generateAppManagerJwt';

export async function registerAppVersionWithVincentApi({
  vincentApiUrl,
  appManagerPrivateKey,
  appId,
  whatChanged,
}: {
  vincentApiUrl: string;
  appManagerPrivateKey: `0x${string}`;
  appId: number;
  whatChanged: string;
}): Promise<{ newAppVersion: number }> {
  const jwtToken = await generateAppManagerJwt({
    appManagerPrivateKey,
  });

  const response = await fetch(`${vincentApiUrl}/app/${appId}/version`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({
      changes: whatChanged,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Register app version with vincent api failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  return {
    newAppVersion: ((await response.json()) as { version: number }).version,
  };
}
