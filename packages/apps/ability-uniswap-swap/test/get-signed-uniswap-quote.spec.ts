import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_NETWORK } from '@lit-protocol/constants';

import { getSignedUniswapQuote } from '../src/lib/prepare/get-signed-uniswap-quote';
import { BASE_RPC_URL, TEST_APP_DELEGATEE_SIGNER } from './helpers/test-variables';
import { QuoteParams } from '../src';

// Extend Jest timeout to 4 minutes
jest.setTimeout(240000);

describe('getSignedUniswapQuote', () => {
  let litNodeClient: LitNodeClient;

  beforeAll(async () => {
    litNodeClient = new LitNodeClient({
      litNetwork: LIT_NETWORK.Datil,
      debug: true,
    });
    await litNodeClient.connect();
  });

  afterAll(async () => {
    await litNodeClient.disconnect();
  });

  it('should get a signed Uniswap quote (with custom slippage tolerance)', async () => {
    const quoteParams: QuoteParams = {
      rpcUrl: BASE_RPC_URL,
      tokenInAddress: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
      tokenInAmount: '1',
      tokenOutAddress: '0x4200000000000000000000000000000000000006',
      recipient: TEST_APP_DELEGATEE_SIGNER.address,
      slippageTolerance: 40,
    };

    const result = await getSignedUniswapQuote({
      quoteParams,
      ethersSigner: TEST_APP_DELEGATEE_SIGNER,
      litNodeClient,
    });

    console.log('Signed Uniswap quote:', result);

    // Verify the structure of the result
    expect(result).toBeDefined();
    expect(result).toHaveProperty('to');
    expect(result).toHaveProperty('value');
    expect(result).toHaveProperty('calldata');
    expect(result).toHaveProperty('estimatedGasUsed');
    expect(result).toHaveProperty('estimatedGasUsedUSD');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('signature');

    // Verify the types and values
    // The "to" field is an address, so it should match the Ethereum address pattern (0x followed by 40 hex chars)
    expect(result.to).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(result.value).toMatch(/^0x[0-9a-fA-F]+$/); // Should be a hex value
    expect(result.calldata).toMatch(/^0x[0-9a-fA-F]+$/); // Should be hex encoded calldata
    expect(result.calldata.length).toBeGreaterThan(10); // Should have substantial calldata

    // Verify gas estimates
    expect(Number(result.estimatedGasUsed)).toBeGreaterThan(0);
    expect(parseFloat(result.estimatedGasUsedUSD)).toBeGreaterThan(0);

    // Verify timestamp
    expect(result.timestamp).toBeLessThanOrEqual(Date.now());

    // Verify signature (currently should be empty as signing is not implemented)
    expect(result.signature).toBe('0x');
  });

  it('should get a signed Uniswap quote (with default slippage tolerance)', async () => {
    const quoteParams: QuoteParams = {
      rpcUrl: BASE_RPC_URL,
      tokenInAddress: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
      tokenInAmount: '1',
      tokenOutAddress: '0x4200000000000000000000000000000000000006',
      recipient: TEST_APP_DELEGATEE_SIGNER.address,
    };

    const result = await getSignedUniswapQuote({
      quoteParams,
      ethersSigner: TEST_APP_DELEGATEE_SIGNER,
      litNodeClient,
    });

    console.log('Signed Uniswap quote:', result);

    // Verify the structure of the result
    expect(result).toBeDefined();
    expect(result).toHaveProperty('to');
    expect(result).toHaveProperty('value');
    expect(result).toHaveProperty('calldata');
    expect(result).toHaveProperty('estimatedGasUsed');
    expect(result).toHaveProperty('estimatedGasUsedUSD');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('signature');

    // Verify the types and values
    // The "to" field is an address, so it should match the Ethereum address pattern (0x followed by 40 hex chars)
    expect(result.to).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(result.value).toMatch(/^0x[0-9a-fA-F]+$/); // Should be a hex value
    expect(result.calldata).toMatch(/^0x[0-9a-fA-F]+$/); // Should be hex encoded calldata
    expect(result.calldata.length).toBeGreaterThan(10); // Should have substantial calldata

    // Verify gas estimates
    expect(Number(result.estimatedGasUsed)).toBeGreaterThan(0);
    expect(parseFloat(result.estimatedGasUsedUSD)).toBeGreaterThan(0);

    // Verify timestamp
    expect(result.timestamp).toBeLessThanOrEqual(Date.now());

    // Verify signature (currently should be empty as signing is not implemented)
    expect(result.signature).toBe('0x');
  });
});
