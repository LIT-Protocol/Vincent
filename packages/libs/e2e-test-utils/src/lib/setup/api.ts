import { Wallet } from 'ethers';
import { createPlatformUserJWT } from '@lit-protocol/vincent-app-sdk/jwt';

import type { SetupConfig } from './types';

/**
 * Generate JWT token for Vincent API authentication
 */
async function generateJWT(privateKey: string, audience: string): Promise<string> {
  const wallet = new Wallet(privateKey);
  const address = await wallet.getAddress();

  const jwt = await createPlatformUserJWT({
    pkpWallet: wallet as any,
    pkpInfo: {
      tokenId: '0', // Not used for app manager auth
      publicKey: wallet.publicKey,
      ethAddress: address,
    },
    payload: {
      name: 'Vincent App Manager',
    },
    expiresInMinutes: 60,
    audience,
    authentication: {
      type: 'wallet',
      value: address,
    },
  });

  return jwt;
}

/**
 * Register app with Vincent API backend
 */
export async function registerAppWithAPI(
  apiUrl: string,
  privateKey: string,
  appId: number,
  metadata: SetupConfig['appMetadata'],
): Promise<void> {
  console.log('=== Registering App with Vincent API ===');
  console.log(`API URL: ${apiUrl}/app`);
  console.log(`App ID: ${appId}`);

  const audience = apiUrl.replace('https://api.', 'registry.').replace('http://api.', 'registry.');
  const jwtToken = await generateJWT(privateKey, audience);

  const response = await fetch(`${apiUrl}/app`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({
      appId,
      name: metadata.name,
      description: metadata.description,
      contactEmail: metadata.contactEmail,
      appUrl: metadata.appUrl,
      logo: metadata.logo,
      deploymentStatus: metadata.deploymentStatus || 'dev',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API registration failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = await response.json();
  console.log('✅ App successfully registered with Vincent API');
  console.log('API Response:', JSON.stringify(data, null, 2));
}

/**
 * Set the active version for an app
 */
export async function setActiveVersion(
  apiUrl: string,
  privateKey: string,
  appId: number,
  activeVersion: number,
): Promise<void> {
  console.log('=== Setting Active Version ===');
  console.log(`App ID: ${appId}`);
  console.log(`Active Version: ${activeVersion}`);

  const audience = apiUrl.replace('https://api.', 'registry.').replace('http://api.', 'registry.');
  const jwtToken = await generateJWT(privateKey, audience);

  const response = await fetch(`${apiUrl}/app/${appId}/setActiveVersion`, {
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
      `Set active version failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = await response.json();
  console.log(`✅ Active version set to ${activeVersion}`);
  console.log('API Response:', JSON.stringify(data, null, 2));
}

/**
 * Register a new app version with Vincent API
 * This should be called after registering a new version on-chain
 * @returns The version number assigned by the API (may differ from on-chain version)
 */
export async function registerAppVersion(
  apiUrl: string,
  privateKey: string,
  appId: number,
  changes = 'New version registered',
): Promise<number> {
  console.log('=== Registering New App Version with Vincent API ===');
  console.log(`App ID: ${appId}`);
  console.log(`Changes: ${changes}`);

  const audience = apiUrl.replace('https://api.', 'registry.').replace('http://api.', 'registry.');
  const jwtToken = await generateJWT(privateKey, audience);

  const response = await fetch(`${apiUrl}/app/${appId}/version`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({
      changes,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Register app version failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = (await response.json()) as { version: number };
  console.log('✅ App version registered successfully');
  console.log('API Response:', JSON.stringify(data, null, 2));

  return data.version;
}

/**
 * Install app response from Vincent API
 */
export interface InstallAppResponse {
  agentSignerAddress: string;
  agentSmartAccountAddress: string;
  appInstallationDataToSign: any;
}

/**
 * Call Vincent API to install the app for a user
 * This creates a PKP for the user and returns the agent signer address
 *
 * @param apiUrl Vincent API URL
 * @param appId App ID to install
 * @param userEoaAddress User's EOA address that will own the smart account
 * @returns Install app response with agent signer address (PKP) and smart account address
 */
export async function installAppViaAPI(
  apiUrl: string,
  appId: number,
  userEoaAddress: string,
): Promise<InstallAppResponse> {
  console.log('=== Installing App via Vincent API ===');
  console.log(`API URL: ${apiUrl}/user/${appId}/install-app`);
  console.log(`User EOA Address: ${userEoaAddress}`);

  const response = await fetch(`${apiUrl}/user/${appId}/install-app`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userControllerAddress: userEoaAddress,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Install app request failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  const data = (await response.json()) as InstallAppResponse;

  console.log('✅ App installation initiated successfully');
  console.log(`Agent Signer Address (PKP): ${data.agentSignerAddress}`);
  console.log(`Agent Smart Account Address: ${data.agentSmartAccountAddress}`);

  return data;
}
