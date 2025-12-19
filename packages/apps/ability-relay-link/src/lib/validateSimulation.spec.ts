import type {
  ValidateSimulationParams,
  SimulateAssetChangesResponse,
} from '@lit-protocol/vincent-ability-sdk/gatedSigner';
import { Address } from 'viem';

import { getRelayLinkExecuteAddresses } from './helpers/relay-link';
import { validateSimulation } from './validateSimulation';

const SENDER = '0xa17a6ef07f775503365ac74922a29f4cef1812ab' as Address;
const CHAIN_ID = 8453; // Base
const relayAddresses = getRelayLinkExecuteAddresses(CHAIN_ID);
const RELAY_RECEIVER = relayAddresses[0];
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;
const OTHER_ADDRESS = '0x9999999999999999999999999999999999999999' as Address;

// USDC -> ETH swap: approve USDC, send USDC, receive ETH
const usdcToEthSwapSimulation = {
  changes: [
    {
      assetType: 'ERC20',
      changeType: 'APPROVE',
      from: SENDER,
      to: RELAY_RECEIVER,
      rawAmount: '1000000',
      amount: '1',
      contractAddress: USDC_ADDRESS,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      tokenId: null,
      logo: null,
    },
    {
      assetType: 'ERC20',
      changeType: 'TRANSFER',
      from: SENDER,
      to: RELAY_RECEIVER,
      rawAmount: '1000000',
      amount: '1',
      contractAddress: USDC_ADDRESS,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      tokenId: null,
      logo: null,
    },
    {
      assetType: 'NATIVE',
      changeType: 'TRANSFER',
      from: RELAY_RECEIVER,
      to: SENDER,
      rawAmount: '500000000000000',
      amount: '0.0005',
      decimals: 18,
      symbol: 'ETH',
      name: 'Ethereum',
      tokenId: null,
      logo: null,
      contractAddress: null,
    },
  ],
  error: null,
} as SimulateAssetChangesResponse;

// ETH -> USDC swap: send ETH, receive USDC
const ethToUsdcSwapSimulation = {
  changes: [
    {
      assetType: 'NATIVE',
      changeType: 'TRANSFER',
      from: SENDER,
      to: RELAY_RECEIVER,
      rawAmount: '1000000000000000',
      amount: '0.001',
      decimals: 18,
      symbol: 'ETH',
      name: 'Ethereum',
      tokenId: null,
      logo: null,
      contractAddress: null,
    },
    {
      assetType: 'ERC20',
      changeType: 'TRANSFER',
      from: RELAY_RECEIVER,
      to: SENDER,
      rawAmount: '1000000',
      amount: '1',
      contractAddress: USDC_ADDRESS,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      tokenId: null,
      logo: null,
    },
  ],
  error: null,
} as SimulateAssetChangesResponse;

const errorSimulation = {
  changes: [],
  error: { message: 'Execution reverted', revertReason: 'Insufficient balance' },
} as SimulateAssetChangesResponse;

const senderApproveToUnauthorizedSimulation = {
  changes: [
    {
      assetType: 'ERC20',
      changeType: 'APPROVE',
      from: SENDER,
      to: OTHER_ADDRESS,
      rawAmount: '1000000',
      amount: '1',
      contractAddress: USDC_ADDRESS,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      tokenId: null,
      logo: null,
    },
  ],
  error: null,
} as SimulateAssetChangesResponse;

const senderTransferToUnauthorizedSimulation = {
  changes: [
    {
      assetType: 'ERC20',
      changeType: 'TRANSFER',
      from: SENDER,
      to: OTHER_ADDRESS,
      rawAmount: '1000000',
      amount: '1',
      contractAddress: USDC_ADDRESS,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      tokenId: null,
      logo: null,
    },
  ],
  error: null,
} as SimulateAssetChangesResponse;

describe('validateSimulation', () => {
  const createParams = (simulation: SimulateAssetChangesResponse): ValidateSimulationParams => ({
    chainId: CHAIN_ID,
    sender: SENDER,
    simulation,
  });

  it('should validate USDC -> ETH swap', () => {
    expect(() => validateSimulation(createParams(usdcToEthSwapSimulation))).not.toThrow();
  });

  it('should validate ETH -> USDC swap', () => {
    expect(() => validateSimulation(createParams(ethToUsdcSwapSimulation))).not.toThrow();
  });

  it('should throw if simulation has error', () => {
    expect(() => validateSimulation(createParams(errorSimulation))).toThrow('Simulation failed');
  });

  it('should throw on ERC20 APPROVE from sender to non-Relay.link address', () => {
    expect(() => validateSimulation(createParams(senderApproveToUnauthorizedSimulation))).toThrow(
      'ERC20 APPROVE from sender must go to a Relay.link contract',
    );
  });

  it('should throw on ERC20 TRANSFER from sender to unauthorized address', () => {
    expect(() => validateSimulation(createParams(senderTransferToUnauthorizedSimulation))).toThrow(
      'ERC20 TRANSFER from sender must go to a Relay.link contract',
    );
  });
});
