import type {
  ValidateSimulationParams,
  SimulateAssetChangesResponse,
} from '@lit-protocol/vincent-ability-sdk/gatedSigner';
import { Address, zeroAddress } from 'viem';

import {
  getAaveAddresses,
  getAvailableMarkets,
  getATokens,
  getFeeContractAddress,
} from './helpers/aave';
import { validateSimulation } from './validateSimulation';

const SENDER = '0xa17a6ef07f775503365ac74922a29f4cef1812ab' as Address;
const CHAIN_ID = 84532; // Base sepolia
const TOKEN = 'USDC';
const feeContract = getFeeContractAddress(CHAIN_ID);
const { POOL: aavePoolAddress } = getAaveAddresses(CHAIN_ID);
const aaveMarkets = getAvailableMarkets(CHAIN_ID);
const usdcAddress = aaveMarkets[TOKEN];
const aTokens = getATokens(CHAIN_ID);
const aUsdcAddress = aTokens[TOKEN];
if (!usdcAddress || !aUsdcAddress) {
  throw new Error(
    `${TOKEN} or a${TOKEN} not found for chain ${CHAIN_ID}. We must use the same ${TOKEN} that Aave uses.`,
  );
}

const successSimulationData = {
  changes: [
    {
      assetType: 'ERC20',
      changeType: 'APPROVE',
      from: SENDER,
      to: feeContract,
      rawAmount: '10000000',
      contractAddress: usdcAddress,
      tokenId: null,
      decimals: 6,
      symbol: TOKEN,
      name: 'USD Coin',
      logo: null,
      amount: '10',
    },
    {
      assetType: 'ERC20',
      changeType: 'TRANSFER',
      from: SENDER,
      to: feeContract,
      rawAmount: '10000000',
      contractAddress: usdcAddress,
      tokenId: null,
      decimals: 6,
      symbol: TOKEN,
      name: 'USD Coin',
      logo: null,
      amount: '10',
    },
    {
      assetType: 'ERC20',
      changeType: 'APPROVE',
      from: SENDER,
      to: feeContract,
      rawAmount: '0',
      contractAddress: usdcAddress,
      tokenId: null,
      decimals: 6,
      symbol: TOKEN,
      name: 'USD Coin',
      logo: null,
      amount: '0',
    },
    {
      assetType: 'ERC20',
      changeType: 'APPROVE',
      from: feeContract,
      to: aavePoolAddress,
      rawAmount: '10000000',
      contractAddress: usdcAddress,
      tokenId: null,
      decimals: 6,
      symbol: TOKEN,
      name: 'USD Coin',
      logo: null,
      amount: '10',
    },
    {
      assetType: 'ERC20',
      changeType: 'TRANSFER',
      from: feeContract,
      to: aUsdcAddress,
      rawAmount: '10000000',
      contractAddress: usdcAddress,
      tokenId: null,
      decimals: 6,
      symbol: TOKEN,
      name: 'USD Coin',
      logo: null,
      amount: '10',
    },
    {
      assetType: 'ERC20',
      changeType: 'APPROVE',
      from: feeContract,
      to: aavePoolAddress,
      rawAmount: '0',
      contractAddress: usdcAddress,
      tokenId: null,
      decimals: 6,
      symbol: TOKEN,
      name: 'USD Coin',
      logo: null,
      amount: '0',
    },
    {
      assetType: 'ERC20',
      changeType: 'TRANSFER',
      from: aUsdcAddress,
      to: feeContract,
      rawAmount: '5000000',
      contractAddress: usdcAddress,
      tokenId: null,
      decimals: 6,
      symbol: TOKEN,
      name: 'USD Coin',
      logo: null,
      amount: '5',
    },
    {
      assetType: 'ERC20',
      changeType: 'TRANSFER',
      from: feeContract,
      to: SENDER,
      rawAmount: '5000000',
      contractAddress: usdcAddress,
      tokenId: null,
      decimals: 6,
      symbol: TOKEN,
      name: 'USD Coin',
      logo: null,
      amount: '5',
    },
    {
      assetType: 'ERC20',
      changeType: 'TRANSFER',
      from: zeroAddress,
      to: SENDER,
      rawAmount: '9999998',
      contractAddress: aUsdcAddress,
      tokenId: null,
      decimals: 6,
      symbol: 'aBasSepLidUSDC',
      name: 'Aave Base Sepolia Lido USDC',
      logo: null,
      amount: '9.999998',
    },
    {
      assetType: 'ERC20',
      changeType: 'APPROVE',
      from: SENDER,
      to: feeContract,
      rawAmount: '10000000',
      contractAddress: aUsdcAddress,
      tokenId: null,
      decimals: 6,
      symbol: 'aBasSepLidUSDC',
      name: 'Aave Base Sepolia Lido USDC',
      logo: null,
      amount: '10',
    },
    {
      assetType: 'ERC20',
      changeType: 'APPROVE',
      from: SENDER,
      to: feeContract,
      rawAmount: '5000000',
      contractAddress: aUsdcAddress,
      tokenId: null,
      decimals: 6,
      symbol: 'aBasSepLidUSDC',
      name: 'Aave Base Sepolia Lido USDC',
      logo: null,
      amount: '5',
    },
    {
      assetType: 'ERC20',
      changeType: 'TRANSFER',
      from: SENDER,
      to: feeContract,
      rawAmount: '5000000',
      contractAddress: aUsdcAddress,
      tokenId: null,
      decimals: 6,
      symbol: 'aBasSepLidUSDC',
      name: 'Aave Base Sepolia Lido USDC',
      logo: null,
      amount: '5',
    },
    {
      assetType: 'ERC20',
      changeType: 'APPROVE',
      from: feeContract,
      to: aavePoolAddress,
      rawAmount: '5000000',
      contractAddress: aUsdcAddress,
      tokenId: null,
      decimals: 6,
      symbol: 'aBasSepLidUSDC',
      name: 'Aave Base Sepolia Lido USDC',
      logo: null,
      amount: '5',
    },
    {
      assetType: 'ERC20',
      changeType: 'TRANSFER',
      from: feeContract,
      to: zeroAddress,
      rawAmount: '5000000',
      contractAddress: aUsdcAddress,
      tokenId: null,
      decimals: 6,
      symbol: 'aBasSepLidUSDC',
      name: 'Aave Base Sepolia Lido USDC',
      logo: null,
      amount: '5',
    },
  ],
  error: null,
} as SimulateAssetChangesResponse;

const errorSimulationData = {
  changes: [],
  error: { message: 'Some error', revertReason: 'Reverted' },
} as SimulateAssetChangesResponse;

describe('validateSimulation', () => {
  const createParams = (simulation: SimulateAssetChangesResponse): ValidateSimulationParams => ({
    chainId: CHAIN_ID,
    sender: SENDER,
    simulation,
  });

  it('should validate the provided simulation on Base Sepolia', () => {
    expect(() => validateSimulation(createParams(successSimulationData))).not.toThrow();
  });

  it('should throw if simulation has error', () => {
    expect(() => validateSimulation(createParams(errorSimulationData))).toThrow(
      'Simulation failed',
    );
  });
});
