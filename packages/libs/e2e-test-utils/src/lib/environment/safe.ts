import { createPimlicoClient } from 'permissionless/clients/pimlico';
import { http } from 'viem';
import { entryPoint07Address } from 'viem/account-abstraction';

function getSafeRpcUrl(): string {
  const SAFE_RPC_URL = process.env.SAFE_RPC_URL as string | undefined;
  if (!SAFE_RPC_URL) {
    throw new Error('Missing SAFE_RPC_URL env variable for chain operations');
  }
  return SAFE_RPC_URL;
}

function getPimlicoRpcUrl(): string {
  const PIMLICO_RPC_URL = process.env.PIMLICO_RPC_URL as string | undefined;
  if (!PIMLICO_RPC_URL) {
    throw new Error('Missing PIMLICO_RPC_URL env variable for bundler operations');
  }
  return PIMLICO_RPC_URL;
}

export const safeVersion = '1.4.1';
export const entryPoint = {
  address: entryPoint07Address,
  version: '0.7',
} as const;

export const getSafeRpc = () => getSafeRpcUrl();
export const getSafeTransport = () => http(getSafeRpcUrl());
export const getPimlicoRpc = () => getPimlicoRpcUrl();
export const getPimlicoTransport = () => http(getPimlicoRpcUrl());

export function createPimlicoPaymaster() {
  return createPimlicoClient({
    entryPoint,
    transport: getPimlicoTransport(),
  });
}
