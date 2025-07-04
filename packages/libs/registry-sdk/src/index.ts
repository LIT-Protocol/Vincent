import openApiJson from './generated/openapi.json';

import { appDoc } from './lib/schemas/app';
import { appVersionDoc, appVersionToolDoc } from './lib/schemas/appVersion';
import { toolDoc, toolVersionDoc } from './lib/schemas/tool';
import { policyDoc, policyVersionDoc } from './lib/schemas/policy';

import { changeOwner } from './lib/schemas/packages';

export * as nodeClient from './nodeClient';
export * as reactClient from './reactClient';

export { openApiJson };

export const baseSchemas = {
  changeOwner,
};

export const docSchemas = {
  appDoc,
  appVersionDoc,
  appVersionToolDoc,
  toolDoc,
  toolVersionDoc,
  policyDoc,
  policyVersionDoc,
};
