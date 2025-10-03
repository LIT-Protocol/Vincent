import { getEnv } from './get-env';

export const DELEGATEE_PRIVATE_KEY = getEnv('DELEGATEE_PRIVATE_KEY');
export const DELEGATOR_ADDRESS = getEnv('DELEGATOR_ADDRESS');
export const RPC_URL = getEnv('RPC_URL');
export const CHAIN_ID = parseInt(getEnv('CHAIN_ID'));
export const ENTRY_POINT = getEnv('ENTRY_POINT');
export const SMART_ACCOUNT_ADDRESS = getEnv('SMART_ACCOUNT_ADDRESS');
