import { exec } from 'node:child_process';
import fs from 'node:fs';

import { VincentAppDefSchema, VincentToolNpmSchema } from '@lit-protocol/vincent-mcp-sdk';
import type { VincentAppDef, VincentAppTools } from '@lit-protocol/vincent-mcp-sdk';
import { Wallet } from 'ethers';
import { generateNonce, SiweMessage } from 'siwe';
import which from 'which';
import { z, type ZodAny, ZodObject } from 'zod';

import { env } from './env';

const { VINCENT_APP_ID, VINCENT_APP_JSON_DEFINITION, VINCENT_REGISTRY_URL } = env;

interface RegistryApp {
  appId: number;
  activeVersion: number;
  name: string;
  description: string;
  redirectUris: string[];
  deploymentStatus: 'dev' | 'test' | 'prod';
  managerAddress: string;
  isDeleted: boolean;
}

interface RegistryAppVersionTool {
  appId: number;
  appVersion: number;
  toolPackageName: string;
  toolVersion: string;
  isDeleted: boolean;
}

const JsonVincentAppToolsSchema = z.record(VincentToolNpmSchema.omit({ version: true }));
const JsonVincentAppSchema = VincentAppDefSchema.extend({
  tools: JsonVincentAppToolsSchema,
}).partial();

type JsonVincentAppTools = z.infer<typeof JsonVincentAppToolsSchema>;

async function installToolPackages(tools: VincentAppTools) {
  return await new Promise<void>((resolve, reject) => {
    const packagesToInstall = Object.entries(tools).map(([toolNpmName, pkgInfo]) => {
      return `${toolNpmName}@${pkgInfo.version}`;
    });

    console.log(`Installing tool packages ${packagesToInstall.join(', ')}...`);
    // When running in the Vincent repo ecosystem, pnpm must be used to avoid conflicts with nx and pnpm configurations
    // On `npx` commands, pnpm might not even be available. We fall back to having `npm` in the running machine (having `npx` implies that)
    const mgr = which.sync('pnpm', { nothrow: true }) ? 'pnpm' : 'npm';
    const command =
      mgr === 'npm'
        ? `npm i ${packagesToInstall.join(' ')} --no-save --production --ignore-scripts`
        : `pnpm i ${packagesToInstall.join(' ')} --save-exact --no-lockfile --ignore-scripts`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(error);
        reject(error);
        return;
      }
      // stderr has the debugger logs so it seems to fail when executing with the debugger
      // if (stderr) {
      //   console.error(stderr);
      //   reject(stderr);
      //   return;
      // }

      console.log(`Successfully installed ${packagesToInstall.join(', ')}`);
      resolve();
    });
  });
}

async function registerVincentTools(tools: VincentAppTools): Promise<VincentAppTools> {
  const toolsObject: VincentAppTools = {};
  for (const [toolPackage, toolData] of Object.entries(tools)) {
    console.log(`Loading tool package ${toolPackage}...`);
    const tool = require(toolPackage); // import cannot find the pkgs just installed as they were not there when the process started
    console.log(`Successfully loaded tool package ${toolPackage}`);

    const bundledVincentTool = tool.bundledVincentTool;
    const { vincentTool } = bundledVincentTool;
    const { toolParamsSchema } = vincentTool;
    const paramsSchema = toolParamsSchema.shape as ZodObject<any>;

    const parameters = Object.entries(paramsSchema).map(([key, value]) => {
      const parameterSchema = value as ZodAny;
      const parameter = {
        name: key,
        ...(parameterSchema.description ? { description: parameterSchema.description } : {}),
      };

      return parameter;
    });

    // Add name, description
    toolsObject[toolPackage] = {
      name: toolPackage,
      // description: 'TODO',
      parameters,
      ...toolData,
    };
  }

  return toolsObject;
}

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
  if (registryData.isDeleted) {
    throw new Error(`Vincent App ${appId} has been deleted from the registry`);
  }
  if (registryData.deploymentStatus !== 'prod') {
    console.warn(
      `Warning: Vincent App ${appId} is deployed as ${registryData.deploymentStatus}. Consider migrating to a production deployment.`,
    );
  }

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

  let toolsObject: VincentAppTools = {};
  registryTools.forEach((rt) => {
    if (rt.isDeleted) {
      throw new Error(
        `Vincent App Version Tool ${rt.toolPackageName}@${rt.toolVersion} has been deleted from the registry`,
      );
    }
    toolsObject[rt.toolPackageName] = {
      version: rt.toolVersion,
    };
  });

  await installToolPackages(toolsObject);
  toolsObject = await registerVincentTools(toolsObject);

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
