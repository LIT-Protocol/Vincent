import openApiJson from './generated/openapi.json';
import { abilityDoc, abilityVersionDoc } from './lib/schemas/ability';
import { appDoc } from './lib/schemas/app';
import { appVersionAbilityDoc, appVersionDoc } from './lib/schemas/appVersion';
import { changeOwner } from './lib/schemas/packages';
import { policyDoc, policyVersionDoc } from './lib/schemas/policy';

export * as nodeClient from './nodeClient';
export * as reactClient from './reactClient';

export { openApiJson };

// Withdraw schemas and types
export type {
  Asset,
  RequestWithdrawRequest,
  RequestWithdrawResponse,
  SignedWithdrawal,
  CompleteWithdrawRequest,
  CompleteWithdrawResponse,
} from './lib/schemas/withdraw';
export {
  assetSchema,
  requestWithdrawRequest,
  requestWithdrawResponse,
  signedWithdrawalSchema,
  completeWithdrawRequest,
  completeWithdrawResponse,
} from './lib/schemas/withdraw';

// Agent funds schemas and types
export type { GetAgentFundsRequest, GetAgentFundsResponse } from './lib/schemas/agentFunds';
export { getAgentFundsRequest, getAgentFundsResponse } from './lib/schemas/agentFunds';

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
