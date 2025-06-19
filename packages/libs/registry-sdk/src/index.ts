import { registry as openAPIRegistry } from './lib/openApi/baseRegistry';
import openApiJson from './generated/openapi.json';

import { AppDef, AppVersionDef, AppToolDef } from './lib/schemas/app';
import { ToolDef, ToolVersionDef } from './lib/schemas/tool';
import { PolicyDef, PolicyVersionDef } from './lib/schemas/policy';

import { CreateApp, CreateAppVersion } from './lib/schemas/app';
import { CreateTool, CreateToolVersion } from './lib/schemas/tool';
import { CreatePolicy, CreatePolicyVersion } from './lib/schemas/policy';

export { vincentApiClientReact } from './generated/vincentApiClientReact';
export { vincentApiClientNode } from './generated/vincentApiClientNode';
export { openApiJson, openAPIRegistry };

export const docSchemas = {
  AppDef,
  AppVersionDef,
  AppToolDef,
  ToolDef,
  ToolVersionDef,
  PolicyDef,
  PolicyVersionDef,
};

export const creationSchemas = {
  CreateApp,
  CreateAppVersion,
  CreateTool,
  CreateToolVersion,
  CreatePolicy,
  CreatePolicyVersion,
};
