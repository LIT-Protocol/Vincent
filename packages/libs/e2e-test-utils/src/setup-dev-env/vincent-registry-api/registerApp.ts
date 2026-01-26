import { generateAppManagerJwt } from './generateAppManagerJwt';
import type { AppMetadata } from '../types';

export async function registerApp({
  vincentApiUrl,
  appManagerPrivateKey,
  appId,
  appMetadata,
}: {
  vincentApiUrl: string;
  appManagerPrivateKey: `0x${string}`;
  appId: number;
  appMetadata: AppMetadata;
}): Promise<void> {
  const jwtToken = await generateAppManagerJwt({
    appManagerPrivateKey,
  });

  const response = await fetch(`${vincentApiUrl}/app`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`,
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
