import { generateSiweAuth } from './generateSiweAuth';

export async function registerAppVersion({
  vincentApiUrl,
  appManagerPrivateKey,
  appId,
  whatChanged,
  domain,
}: {
  vincentApiUrl: string;
  appManagerPrivateKey: `0x${string}`;
  appId: number;
  whatChanged: string;
  domain?: string;
}): Promise<{ newAppVersion: number }> {
  const authHeader = await generateSiweAuth({
    appManagerPrivateKey,
    vincentApiUrl,
    domain,
  });

  const response = await fetch(`${vincentApiUrl}/app/${appId}/version`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
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
