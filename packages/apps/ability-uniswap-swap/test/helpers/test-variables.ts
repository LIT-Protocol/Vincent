import { Wallet } from 'ethers';

import { getEnv } from './get-env';

export const BASE_RPC_URL = getEnv('BASE_RPC_URL');

export const TEST_APP_DELEGATEE_PRIVATE_KEY = getEnv('TEST_APP_DELEGATEE_PRIVATE_KEY');
export const TEST_APP_DELEGATEE_SIGNER = new Wallet(TEST_APP_DELEGATEE_PRIVATE_KEY);
