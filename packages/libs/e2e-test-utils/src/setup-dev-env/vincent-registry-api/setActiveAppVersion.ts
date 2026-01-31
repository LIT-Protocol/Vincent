import { generateSiweAuth } from './generateSiweAuth';

export async function setActiveVersion({
  vincentApiUrl,
  appManagerPrivateKey,
  appId,
  activeVersion,
  domain,
}: {
  vincentApiUrl: string;
  appManagerPrivateKey: `0x${string}`;
  appId: number;
  activeVersion: number;
  domain?: string;
}): Promise<void> {
  console.log('=== Setting active version with Vincent API ===');

  const authHeader = await generateSiweAuth({
    appManagerPrivateKey,
    vincentApiUrl,
    domain,
  });

  const response = await fetch(`${vincentApiUrl}/app/${appId}/setActiveVersion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
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
