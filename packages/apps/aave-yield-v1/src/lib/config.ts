import { config as loadEnv } from 'dotenv';
import { z } from 'zod';
import { getAddress } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import type { Address, Chain } from 'viem';

const ConfigSchema = z.object({
  APP_ID: z.string(),
  DELEGATEE_PRIVATE_KEY: z.string(),
  AGENT_ADDRESS: z.string(),
  DELEGATOR_PKP_ADDRESS: z.string(),
  BASE_RPC_URL: z.string().url(),
  ALCHEMY_RPC_URL: z.string().url(),
  ZERODEV_RPC_URL: z.string().url(),
  SERIALIZED_PERMISSION_ACCOUNT: z.string(),
  DEPOSIT_AMOUNT: z.string().regex(/^\d+(\.\d+)?$/),
  CHAIN_ID: z.string().optional(),
});

export type AppConfig = {
  appId: number;
  delegateePrivateKey: string;
  agentAddress: Address;
  delegatorPkpAddress: Address;
  baseRpcUrl: string;
  alchemyRpcUrl: string;
  zerodevRpcUrl: string;
  serializedPermissionAccount: string;
  depositAmount: string;
  chainId: number;
  chain: Chain;
  allowlistSymbols: string[];
};

export function loadConfig(): AppConfig {
  loadEnv();
  const env = ConfigSchema.parse(process.env);
  const chainId = Number(env.CHAIN_ID ?? 84532);

  let chain: Chain;
  if (chainId === 8453) {
    chain = base;
  } else if (chainId === 84532) {
    chain = baseSepolia;
  } else {
    throw new Error(`Unsupported CHAIN_ID ${chainId}. Use 8453 or 84532.`);
  }

  return {
    appId: Number(env.APP_ID),
    delegateePrivateKey: env.DELEGATEE_PRIVATE_KEY,
    agentAddress: getAddress(env.AGENT_ADDRESS),
    delegatorPkpAddress: getAddress(env.DELEGATOR_PKP_ADDRESS),
    baseRpcUrl: env.BASE_RPC_URL,
    alchemyRpcUrl: env.ALCHEMY_RPC_URL,
    zerodevRpcUrl: env.ZERODEV_RPC_URL,
    serializedPermissionAccount: env.SERIALIZED_PERMISSION_ACCOUNT,
    depositAmount: env.DEPOSIT_AMOUNT,
    chainId,
    chain,
    allowlistSymbols: ['USDC', 'USDbC', 'DAI', 'USDT'],
  };
}
