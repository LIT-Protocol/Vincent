import fs from 'node:fs';

import { VincentAppDefSchema } from '@lit-protocol/vincent-mcp-sdk';
import type { VincentAppDef } from '@lit-protocol/vincent-mcp-sdk';
import { Wallet } from 'ethers';
import { generateNonce, SiweMessage } from 'siwe';

import { env } from './env';

const { VINCENT_APP_ID, VINCENT_APP_JSON_DEFINITION, VINCENT_REGISTRY_URL } = env;

async function getAppDataFromRegistry(appId: string): Promise<Partial<VincentAppDef>> {
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

  const registryAppResponse = await fetch(`${VINCENT_REGISTRY_URL}/app/${appId}`, {
    headers: {
      Authorization: `SIWE ${Buffer.from(JSON.stringify({ message, signature })).toString('base64')}`,
    },
  });
  const registryData = (await registryAppResponse.json()) as any; // TODO type this
  // if (!registryAppResponse.ok) {
  const appVersion = registryData.activeVersion.toString();

  const registryToolsResponse = await fetch(
    `${VINCENT_REGISTRY_URL}/app/${appId}/version/${appVersion}/tools`,
    {
      headers: {
        Authorization: `SIWE ${Buffer.from(JSON.stringify({ message, signature })).toString('base64')}`,
      },
    },
  );
  const registryTools = (await registryToolsResponse.json()) as any[]; // TODO type this
  // if (!registryToolsResponse.ok) {}

  const toolsObject = registryTools.reduce((acc, rt) => {
    acc[rt.toolPackageName] = {
      version: rt.toolVersion,
    };
  }, {});

  return {
    id: appId,
    version: appVersion,
    name: registryData.name,
    description: registryData?.description,
    tools: toolsObject,
  };
}

export async function getVincentAppDef(): Promise<VincentAppDef> {
  // Load data from the App definition JSON
  const appJson = VINCENT_APP_JSON_DEFINITION
    ? fs.readFileSync(VINCENT_APP_JSON_DEFINITION, { encoding: 'utf8' })
    : '{}';
  const _appJsonDef = JSON.parse(appJson) as Partial<VincentAppDef>;

  if (!VINCENT_APP_ID && !_appJsonDef.id) {
    throw new Error(
      'VINCENT_APP_ID is not set and no app.json file was provided. Need Vincent App Id in one of those sources',
    );
  }
  if (_appJsonDef.id && VINCENT_APP_ID && _appJsonDef.id !== VINCENT_APP_ID) {
    console.warn(
      `The Vincent App Id specified in the environment variable VINCENT_APP_ID (${VINCENT_APP_ID}) does not match the Id in ${VINCENT_APP_JSON_DEFINITION} (${_appJsonDef.id}). Using the Id from the file...`,
    );
  }

  const vincentAppId = _appJsonDef.id ?? (VINCENT_APP_ID as string);
  const registryData = await getAppDataFromRegistry(vincentAppId);
  // const registryData = {} as any;

  const vincentAppDef = VincentAppDefSchema.parse({
    id: vincentAppId,
    name: _appJsonDef.name || registryData?.name,
    version: _appJsonDef.version || registryData?.version,
    description: _appJsonDef.description || registryData?.description,
    tools: _appJsonDef.tools || [],
  });

  return vincentAppDef;
}
