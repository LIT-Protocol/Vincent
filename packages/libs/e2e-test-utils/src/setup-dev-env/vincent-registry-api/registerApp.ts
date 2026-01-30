import type { AppMetadata } from '../setupVincentDevEnv';

import { generateSiweAuth } from './generateSiweAuth';

export async function registerApp({
  vincentApiUrl,
  appManagerPrivateKey,
  appId,
  appMetadata,
  domain,
}: {
  vincentApiUrl: string;
  appManagerPrivateKey: `0x${string}`;
  appId: number;
  appMetadata: AppMetadata;
  domain?: string;
}): Promise<void> {
  const authHeader = await generateSiweAuth({
    appManagerPrivateKey,
    vincentApiUrl,
    domain,
  });

  const response = await fetch(`${vincentApiUrl}/app`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({
      appId,
      name: appMetadata.name,
      description: appMetadata.description,
      contactEmail: appMetadata.contactEmail,
      appUrl: appMetadata.appUrl,
      logo: appMetadata.logo,
      deploymentStatus: appMetadata.deploymentStatus || 'dev',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Register app with Vincent API failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }
}
