import { generateAppManagerJwt } from './generateAppManagerJwt';

export async function setActiveVersion({
  vincentApiUrl,
  appManagerPrivateKey,
  appId,
  activeVersion,
}: {
  vincentApiUrl: string;
  appManagerPrivateKey: `0x${string}`;
  appId: number;
  activeVersion: number;
}): Promise<void> {
  console.log('=== Setting active version with Vincent API ===');

  const jwtToken = await generateAppManagerJwt({
    appManagerPrivateKey,
  });

  const response = await fetch(`${vincentApiUrl}/app/${appId}/setActiveVersion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({
      activeVersion,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Set active version with Vincent API failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }
}
