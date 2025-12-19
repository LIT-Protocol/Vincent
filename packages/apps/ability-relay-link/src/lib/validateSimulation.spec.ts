import type {
  ValidateSimulationParams,
  SimulateAssetChangesResponse,
} from '@lit-protocol/vincent-ability-sdk/gatedSigner';
import { Address } from 'viem';

import { fetchRelayLinkAddresses } from './helpers/relay-link';
import { validateSimulation } from './validateSimulation';

const SENDER = '0xa17a6ef07f775503365ac74922a29f4cef1812ab' as Address;
const CHAIN_ID = 8453; // Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address;
const OTHER_ADDRESS = '0x9999999999999999999999999999999999999999' as Address;

// Relay addresses are fetched async, so we need to load them before tests
let RELAY_RECEIVER: Address;

// Simulation data (created after RELAY_RECEIVER is loaded)
let usdcToEthSwapSimulation: SimulateAssetChangesResponse;
let ethToUsdcSwapSimulation: SimulateAssetChangesResponse;
let errorSimulation: SimulateAssetChangesResponse;
let senderApproveToUnauthorizedSimulation: SimulateAssetChangesResponse;
let senderTransferToUnauthorizedSimulation: SimulateAssetChangesResponse;

beforeAll(async () => {
  const relayAddresses = await fetchRelayLinkAddresses(CHAIN_ID);
  RELAY_RECEIVER = relayAddresses[0];

  // USDC -> ETH swap: approve USDC, send USDC, receive ETH
  usdcToEthSwapSimulation = {
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
  ethToUsdcSwapSimulation = {
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

  errorSimulation = {
    changes: [],
    error: { message: 'Execution reverted', revertReason: 'Insufficient balance' },
  } as SimulateAssetChangesResponse;

  senderApproveToUnauthorizedSimulation = {
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

  senderTransferToUnauthorizedSimulation = {
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
});

describe('validateSimulation', () => {
  const createParams = (simulation: SimulateAssetChangesResponse): ValidateSimulationParams => ({
    chainId: CHAIN_ID,
    sender: SENDER,
    simulation,
  });

  it('should validate USDC -> ETH swap', async () => {
    await expect(validateSimulation(createParams(usdcToEthSwapSimulation))).resolves.not.toThrow();
  });

  it('should validate ETH -> USDC swap', async () => {
    await expect(validateSimulation(createParams(ethToUsdcSwapSimulation))).resolves.not.toThrow();
  });

  it('should throw if simulation has error', async () => {
    await expect(validateSimulation(createParams(errorSimulation))).rejects.toThrow(
      'Simulation failed',
    );
  });

  it('should throw on ERC20 APPROVE from sender to non-Relay.link address', async () => {
    await expect(
      validateSimulation(createParams(senderApproveToUnauthorizedSimulation)),
    ).rejects.toThrow('ERC20 APPROVE from sender must go to a Relay.link contract');
  });

  it('should throw on ERC20 TRANSFER from sender to unauthorized address', async () => {
    await expect(
      validateSimulation(createParams(senderTransferToUnauthorizedSimulation)),
    ).rejects.toThrow('ERC20 TRANSFER from sender must go to a Relay.link contract');
  });
});
