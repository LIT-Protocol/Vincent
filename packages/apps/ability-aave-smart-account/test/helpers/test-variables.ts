import { getEnv } from './get-env';

export const RPC_URL = getEnv('RPC_URL');
export const CHAIN_ID = parseInt(getEnv('CHAIN_ID'));
export const ENTRY_POINT = getEnv('ENTRY_POINT');
export const SMART_ACCOUNT_ADDRESS = getEnv('SMART_ACCOUNT_ADDRESS');
