import fs from 'node:fs';

import { VincentAppDefSchema, VincentToolNpmSchema } from '@lit-protocol/vincent-mcp-sdk';
import type {
  VincentAppDef,
  VincentAppTools,
  VincentParameter,
} from '@lit-protocol/vincent-mcp-sdk';
import type { BundledVincentTool, VincentTool } from '@lit-protocol/vincent-tool-sdk';
import { nodeClient } from '@lit-protocol/vincent-registry-sdk';
import { npxImport } from 'npx-import';
import { z, ZodObject } from 'zod';

import { env } from './env';
import { store as registryStore } from './registry';

const { VINCENT_APP_ID, VINCENT_APP_JSON_DEFINITION, VINCENT_APP_VERSION } = env;
const { vincentApiClientNode } = nodeClient;

/**
 * Zod schema for Vincent application tools defined in a JSON file.
 * This schema omits the `version` field, as it's expected to come from the registry.
 * @hidden
 */
const JsonVincentAppToolsSchema = z.record(VincentToolNpmSchema.omit({ version: true }));

/**
 * Zod schema for a Vincent application definition provided in a JSON file.
 * This schema allows for partial definitions, which will be merged with data from the registry.
 * @hidden
 */
const JsonVincentAppSchema = VincentAppDefSchema.extend({
  tools: JsonVincentAppToolsSchema,
}).partial();

/**
 * Type representing a collection of Vincent application tools defined in a JSON file.
 * @hidden
 */
type JsonVincentAppTools = z.infer<typeof JsonVincentAppToolsSchema>;

type ToolPackage = {
  bundledVincentTool: BundledVincentTool<VincentTool<any, any, any, any>>;
};
/**
 * Loads the installed tool packages and enriches the tool definitions with details from the packages.
 *
 * This function dynamically requires each tool package to access its bundled information,
 * such as parameter schemas, and updates the tool definitions accordingly.
 *
 * @param {VincentAppTools} tools - The initial tool definitions, typically from the registry.
 * @returns {Promise<VincentAppTools>} A promise that resolves with the enriched tool definitions.
 * @hidden
 */
async function registerVincentTools(tools: VincentAppTools): Promise<VincentAppTools> {
  const packagesToInstall = Object.entries(tools).map(([toolNpmName, pkgInfo]) => {
    return `${toolNpmName}@${pkgInfo.version}`;
  });
  const toolsPkgs = await npxImport<ToolPackage[]>(packagesToInstall); // TODO: add a type for the exposed object, in tools-sdk

  const toolsObject: VincentAppTools = {};
  for (const [toolPackage, toolData] of Object.entries(tools)) {
    const tool = toolsPkgs.find(
      (tool) => toolPackage === tool.bundledVincentTool.vincentTool.packageName,
    );
    if (!tool) {
      throw new Error(`Tried to import tool ${toolPackage} but could not find it`);
    }

    const { vincentTool } = tool.bundledVincentTool;
    const { toolDescription, toolParamsSchema } = vincentTool;
    const paramsSchema = toolParamsSchema.shape as ZodObject<any>;

    const parameters = {} as Record<string, VincentParameter>;
    Object.entries(paramsSchema).forEach(([key, value]) => {
      parameters[key] = {
        ...(value.description ? { description: value.description } : {}),
      };
    });

    // Add name, description
    toolsObject[toolPackage] = {
      name: toolPackage,
      description: toolDescription,
      parameters,
      ...toolData,
    };
  }

  return toolsObject;
}

/**
 * Fetches the application definition from the Vincent Registry.
 *
 * This includes the app's metadata and the list of associated tools for the active version.
 * It authenticates with the registry using a temporary SIWE message.
 *
 * @param {string} appId - The ID of the Vincent application.
 * @param {string} appVersion - The version of the Vincent application.
 * @returns {Promise<VincentAppDef>} A promise that resolves with the application definition from the registry.
 * @hidden
 */
async function getAppDataFromRegistry(
  appId: string,
  appVersion: string | undefined,
): Promise<VincentAppDef> {
  const registryAppQuery = await registryStore.dispatch(
    vincentApiClientNode.endpoints.getApp.initiate({ appId: Number(appId) }),
  );
  const registryApp = registryAppQuery.data;
  if (!registryApp) {
    throw new Error(`Failed to retrieve registry app data for Vincent App ${appId}.`);
  }
  if (registryApp.isDeleted) {
    throw new Error(`Vincent App ${appId} has been deleted from the registry`);
  }
  if (registryApp.deploymentStatus !== 'prod') {
    console.warn(
      `Warning: Vincent App ${appId} is deployed as ${registryApp.deploymentStatus}. Consider migrating to a production deployment.`,
    );
  }

  const vincentAppVersion = Number(appVersion) || registryApp.activeVersion;
  if (!vincentAppVersion) {
    throw new Error(
      `Failed to define Vincent App version for ${appId}. Either specify a version in the app definition file, set the VINCENT_APP_VERSION environment variable or ensure the registry has an active version.`,
    );
  }

  const registryToolsQuery = await registryStore.dispatch(
    vincentApiClientNode.endpoints.listAppVersionTools.initiate({
      appId: Number(appId),
      version: vincentAppVersion,
    }),
  );
  const registryToolsData = registryToolsQuery.data;
  if (!registryToolsData) {
    throw new Error(`Failed to retrieve tools for Vincent App ${appId}.`);
  }

  let toolsObject: VincentAppTools = {};
  registryToolsData.forEach((rt) => {
    if (rt.isDeleted) {
      throw new Error(
        `Vincent App Version Tool ${rt.toolPackageName}@${rt.toolVersion} has been deleted from the registry`,
      );
    }
    toolsObject[rt.toolPackageName] = {
      version: rt.toolVersion,
    };
  });

  toolsObject = await registerVincentTools(toolsObject);

  return {
    id: appId,
    version: vincentAppVersion.toString(),
    name: registryApp.name,
    description: registryApp?.description,
    tools: toolsObject,
  };
}

/**
 * Merges tool definitions from a JSON file with those from the registry.
 *
 * Properties in the JSON file will override the corresponding properties from the registry.
 *
 * @param {JsonVincentAppTools | undefined} jsonTools - The tool definitions from the JSON file.
 * @param {VincentAppTools} registryTools - The tool definitions from the registry.
 * @returns {VincentAppTools} The merged tool definitions.
 * @hidden
 */
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

/**
 * Constructs the complete Vincent application definition.
 *
 * This function orchestrates the process of fetching the base application definition from the
 * Vincent Registry and merging it with any local overrides provided in a JSON file
 * (specified by `VINCENT_APP_JSON_DEFINITION`). It also handles the installation of
 * required tool packages. The final app definition is validated against the schema.
 *
 * @returns {Promise<VincentAppDef>} A promise that resolves with the final, validated Vincent application definition.
 */
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
  if (jsonData.id && VINCENT_APP_VERSION && jsonData.version !== VINCENT_APP_VERSION) {
    console.warn(
      `The Vincent App version specified in the environment variable VINCENT_APP_VERSION (${VINCENT_APP_VERSION}) does not match the version in ${VINCENT_APP_JSON_DEFINITION} (${jsonData.version}). Using the version from the file...`,
    );
  }

  const vincentAppId = jsonData.id ?? (VINCENT_APP_ID as string);
  const vincentAppVersion = jsonData.version ?? VINCENT_APP_VERSION;
  const registryData = await getAppDataFromRegistry(vincentAppId, vincentAppVersion);

  const vincentAppDef = VincentAppDefSchema.parse({
    id: vincentAppId,
    name: jsonData.name || registryData.name,
    version: jsonData.version || registryData.version,
    description: jsonData.description || registryData.description,
    tools: mergeToolData(jsonData.tools, registryData.tools),
  });

  return vincentAppDef;
}
