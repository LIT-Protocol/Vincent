import { ethers } from 'ethers';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { generateVincentAbilitySessionSigs } from '@lit-protocol/vincent-app-sdk/abilityClient';

import type {
  PrepareResponse,
  PrepareSignedUniswapQuote,
  PrepareSuccessResult,
  QuoteParams,
} from './types';
import VincentPrepareMetadata from '../../generated/vincent-prepare-metadata.json';
import { validateSignedUniswapQuote } from './validate-signed-uniswap-quote';

export const getSignedUniswapQuote = async ({
  quoteParams,
  ethersSigner,
  litNodeClient,
}: {
  quoteParams: QuoteParams;
  ethersSigner: ethers.Signer;
  litNodeClient: LitNodeClient;
}): Promise<PrepareSignedUniswapQuote> => {
  const sessionSigs = await generateVincentAbilitySessionSigs({ ethersSigner, litNodeClient });

  const { ipfsCid, pkpPublicKey, pkpEthAddress } = VincentPrepareMetadata;
  if (!ipfsCid) {
    throw new Error('Prepare Lit Action IPFS CID is not set');
  }
  if (!pkpPublicKey) {
    throw new Error('Prepare Lit Action PKP Public Key is not set');
  }
  if (!pkpEthAddress) {
    throw new Error('Prepare Lit Action PKP Eth Address is not set');
  }

  const result = await litNodeClient.executeJs({
    ipfsId: ipfsCid,
    sessionSigs,
    jsParams: {
      quoteParams,
      pkpPublicKey: pkpPublicKey.replace(/^0x/, ''),
    },
  });

  const signature = result.signatures['prepare-uniswap-route-signature'];
  if (!signature) {
    throw new Error('No signature of Uniswap Quote from Prepare Lit Action');
  }

  const prepareResponse = result.response as PrepareResponse;
  if (!prepareResponse) {
    throw new Error(`No response from Lit Action: ${JSON.stringify(result)}`);
  }

  if (!prepareResponse.success) {
    throw new Error(prepareResponse.error);
  }

  const uniswapQuote = prepareResponse.quote;

  const prepareSuccessResult: PrepareSuccessResult = {
    quote: uniswapQuote,
    signature: signature.signature,
  };

  validateSignedUniswapQuote({
    prepareSuccessResult,
    expectedSignerEthAddress: pkpEthAddress,
  });

  return {
    ...prepareSuccessResult,
    dataSigned: signature.dataSigned,
    signerPublicKey: signature.publicKey,
    signerEthAddress: pkpEthAddress,
  };
};
