import openApiJson from './generated/openapi.json';
import { abilityDoc, abilityVersionDoc } from './lib/schemas/ability';
import { appDoc } from './lib/schemas/app';
import { appVersionDoc, appVersionAbilityDoc } from './lib/schemas/appVersion';
import { changeOwner } from './lib/schemas/packages';
import { policyDoc, policyVersionDoc } from './lib/schemas/policy';

export * as nodeClient from './nodeClient';
export * as reactClient from './reactClient';

export { openApiJson };

export const baseSchemas = {
  changeOwner,
};

export const docSchemas = {
  appDoc,
  appVersionDoc,
  appVersionAbilityDoc,
  abilityDoc,
  abilityVersionDoc,
  policyDoc,
  policyVersionDoc,
};
