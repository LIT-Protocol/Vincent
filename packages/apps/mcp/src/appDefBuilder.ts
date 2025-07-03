import fs from 'node:fs';

import { VincentAppDefSchema, VincentToolNpmSchema } from '@lit-protocol/vincent-mcp-sdk';
import type { VincentAppDef, VincentAppTools } from '@lit-protocol/vincent-mcp-sdk';
import { Wallet } from 'ethers';
import { generateNonce, SiweMessage } from 'siwe';
import { z } from 'zod';

import { env } from './env';

const { VINCENT_APP_ID, VINCENT_APP_JSON_DEFINITION, VINCENT_REGISTRY_URL } = env;

interface RegistryApp {
  _id: string;
  appId: number;
  activeVersion: number;
  name: string;
  description: string;
  contactEmail: string;
  appUserUrl: string;
  logo: string;
  redirectUris: string[];
  deploymentStatus: string;
  managerAddress: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface RegistryAppVersionTool {
  _id: string;
  appId: number;
  appVersion: number;
  toolPackageName: string;
  toolVersion: string;
  hiddenSupportedPolicies: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const JsonVincentAppToolsSchema = z.record(VincentToolNpmSchema.omit({ version: true }));
const JsonVincentAppSchema = VincentAppDefSchema.extend({
  tools: JsonVincentAppToolsSchema,
}).partial();

type JsonVincentAppTools = z.infer<typeof JsonVincentAppToolsSchema>;

async function getAppDataFromRegistry(appId: string): Promise<VincentAppDef> {
  const delegateeSigner = Wallet.createRandom();
  const address = await delegateeSigner.getAddress();

  const siweMessage = new SiweMessage({
    address,
    chainId: 1,
    domain: VINCENT_REGISTRY_URL,
    issuedAt: new Date().toISOString(),
    nonce: generateNonce(),
    statement: 'Sign in with Ethereum to authenticate with Vincent Registry API',
    uri: VINCENT_REGISTRY_URL,
    version: '1',
  });
  const message = siweMessage.prepareMessage();
  const signature = await delegateeSigner.signMessage(message);
  const authorization = `SIWE ${Buffer.from(JSON.stringify({ message, signature })).toString('base64')}`;

  const registryAppResponse = await fetch(`${VINCENT_REGISTRY_URL}/app/${appId}`, {
    headers: {
      Authorization: authorization,
    },
  });
  if (!registryAppResponse.ok) {
    throw new Error(
      `Failed to retrieve app data for ${appId}. Request status code: ${registryAppResponse.status}, error: ${await registryAppResponse.text()}, `,
    );
  }
  const registryData = (await registryAppResponse.json()) as RegistryApp;
  const appVersion = registryData.activeVersion.toString();

  const registryToolsResponse = await fetch(
    `${VINCENT_REGISTRY_URL}/app/${appId}/version/${appVersion}/tools`,
    {
      headers: {
        Authorization: authorization,
      },
    },
  );
  const registryTools = (await registryToolsResponse.json()) as RegistryAppVersionTool[];
  if (!registryToolsResponse.ok) {
    throw new Error(
      `Failed to retrieve tools for ${appId}. Request status code: ${registryToolsResponse.status}, error: ${await registryToolsResponse.text()}`,
    );
  }

  const toolsObject: VincentAppTools = {};
  registryTools.forEach((rt) => {
    toolsObject[rt.toolPackageName] = {
      version: rt.toolVersion,
    };
  });

  return {
    id: appId,
    version: appVersion,
    name: registryData.name,
    description: registryData?.description,
    tools: toolsObject,
  };
}

function mergeToolData(
  jsonTools: JsonVincentAppTools | undefined,
  registryTools: VincentAppTools,
): VincentAppTools {
  if (!jsonTools) return registryTools;

  const mergedTools: VincentAppTools = {};
  Object.entries(jsonTools).forEach(([toolKey, toolValue]) => {
    mergedTools[toolKey] = Object.assign({}, registryTools[toolKey], toolValue);
  });

  return mergedTools;
}

export async function getVincentAppDef(): Promise<VincentAppDef> {
  // Load data from the App definition JSON
  const appJson = VINCENT_APP_JSON_DEFINITION
    ? fs.readFileSync(VINCENT_APP_JSON_DEFINITION, { encoding: 'utf8' })
    : '{}';
  const jsonData = JsonVincentAppSchema.parse(JSON.parse(appJson)) as Partial<VincentAppDef>;

  if (!VINCENT_APP_ID && !jsonData.id) {
    throw new Error(
      'VINCENT_APP_ID is not set and no app.json file was provided. Need Vincent App Id in one of those sources',
    );
  }
  if (jsonData.id && VINCENT_APP_ID && jsonData.id !== VINCENT_APP_ID) {
    console.warn(
      `The Vincent App Id specified in the environment variable VINCENT_APP_ID (${VINCENT_APP_ID}) does not match the Id in ${VINCENT_APP_JSON_DEFINITION} (${jsonData.id}). Using the Id from the file...`,
    );
  }

  const vincentAppId = jsonData.id ?? (VINCENT_APP_ID as string);
  const registryData = await getAppDataFromRegistry(vincentAppId);

  const vincentAppDef = VincentAppDefSchema.parse({
    id: vincentAppId,
    name: jsonData.name || registryData.name,
    version: jsonData.version || registryData.version,
    description: jsonData.description || registryData.description,
    tools: mergeToolData(jsonData.tools, registryData.tools),
  });

  return vincentAppDef;
}
