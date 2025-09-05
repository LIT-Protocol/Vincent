import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_NETWORK } from '@lit-protocol/constants';
import { ethers } from 'ethers';
import deterministicJsonStringify from 'json-stable-stringify';

import { getSignedUniswapQuote } from '../src/lib/prepare/get-signed-uniswap-quote';
import { BASE_RPC_URL, TEST_APP_DELEGATEE_SIGNER } from './helpers/test-variables';
import { QuoteParams } from '../src';
import VincentPrepareMetadata from '../src/generated/vincent-prepare-metadata.json';

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

    // Verify the result is defined
    expect(result).toBeDefined();

    const { quote } = result;

    // Verify the types and values
    expect(typeof quote.chainId).toBe('number');
    expect(quote.to).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(quote.value).toMatch(/^0x[0-9a-fA-F]+$/);
    expect(quote.calldata).toMatch(/^0x[0-9a-fA-F]+$/);

    expect(quote.tokenIn).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(quote.amountIn).toMatch(/^\d+(\.\d+)?$/);
    expect(typeof quote.tokenInDecimals).toBe('number');
    expect(quote.tokenInDecimals).toBeGreaterThan(0);

    expect(quote.tokenOut).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(quote.amountOut).toMatch(/^\d+(\.\d+)?$/);
    expect(typeof quote.tokenOutDecimals).toBe('number');
    expect(quote.tokenOutDecimals).toBeGreaterThan(0);

    expect(quote.quote).toMatch(/^\d+(\.\d+)?$/);
    expect(quote.estimatedGasUsed).toMatch(/^\d+$/);
    expect(quote.estimatedGasUsedUSD).toMatch(/^\d+(\.\d+)?$/);
    expect(typeof quote.blockNumber).toBe('string');
    expect(typeof quote.timestamp).toBe('number');

    // Verify signature format and validation
    expect(result.signature).toMatch(/^0x[0-9a-fA-F]{130}$/);

    // Verify signature is a valid eth personal sign of the quote data
    const { signature, dataSigned, signerPublicKey } = result;
    const deterministicallyStringifiedQuote = deterministicJsonStringify(quote);
    if (!deterministicallyStringifiedQuote) {
      throw new Error('Failed to stringify Uniswap quote');
    }
    const messageToSign = deterministicallyStringifiedQuote;
    const messageHash = ethers.utils.hashMessage(messageToSign);

    // Verify signerPublicKey format and matches metadata
    expect(signerPublicKey).toMatch(/^04[0-9a-fA-F]{128}$/); // Uncompressed public key format
    expect(signerPublicKey).toBe(
      VincentPrepareMetadata.pkpPublicKey.replace(/^0x/, '').toUpperCase(),
    );

    // Recover the address from the signature
    const recoveredAddress = ethers.utils.recoverAddress(messageHash, signature);

    // Verify the signature was made by the PKP
    expect(recoveredAddress.toLowerCase()).toBe(VincentPrepareMetadata.pkpEthAddress.toLowerCase());

    // Verify dataSigned field matches the message hash
    expect(dataSigned).toBe(messageHash.slice(2).toUpperCase()); // Remove 0x prefix
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

    // Verify the result is defined
    expect(result).toBeDefined();

    const { quote } = result;

    // Verify the types and values
    expect(typeof quote.chainId).toBe('number');
    expect(quote.to).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(quote.value).toMatch(/^0x[0-9a-fA-F]+$/);
    expect(quote.calldata).toMatch(/^0x[0-9a-fA-F]+$/);

    expect(quote.tokenIn).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(quote.amountIn).toMatch(/^\d+(\.\d+)?$/);
    expect(typeof quote.tokenInDecimals).toBe('number');
    expect(quote.tokenInDecimals).toBeGreaterThan(0);

    expect(quote.tokenOut).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(quote.amountOut).toMatch(/^\d+(\.\d+)?$/);
    expect(typeof quote.tokenOutDecimals).toBe('number');
    expect(quote.tokenOutDecimals).toBeGreaterThan(0);

    expect(quote.quote).toMatch(/^\d+(\.\d+)?$/);
    expect(quote.estimatedGasUsed).toMatch(/^\d+$/);
    expect(quote.estimatedGasUsedUSD).toMatch(/^\d+(\.\d+)?$/);
    expect(typeof quote.blockNumber).toBe('string');
    expect(typeof quote.timestamp).toBe('number');

    // Verify signature format and validation
    expect(result.signature).toMatch(/^0x[0-9a-fA-F]{130}$/);

    // Verify signature is a valid eth personal sign of the quote data
    const { signature, dataSigned, signerPublicKey } = result;
    const deterministicallyStringifiedQuote = deterministicJsonStringify(quote);
    if (!deterministicallyStringifiedQuote) {
      throw new Error('Failed to stringify Uniswap quote');
    }
    const messageToSign = deterministicallyStringifiedQuote;
    const messageHash = ethers.utils.hashMessage(messageToSign);

    // Verify signerPublicKey format and matches metadata
    expect(signerPublicKey).toMatch(/^04[0-9a-fA-F]{128}$/); // Uncompressed public key format
    expect(signerPublicKey).toBe(
      VincentPrepareMetadata.pkpPublicKey.replace(/^0x/, '').toUpperCase(),
    );

    // Recover the address from the signature
    const recoveredAddress = ethers.utils.recoverAddress(messageHash, signature);

    // Verify the signature was made by the PKP
    expect(recoveredAddress.toLowerCase()).toBe(VincentPrepareMetadata.pkpEthAddress.toLowerCase());

    // Verify dataSigned field matches the message hash
    expect(dataSigned).toBe(messageHash.slice(2).toUpperCase()); // Remove 0x prefix
  });
});
