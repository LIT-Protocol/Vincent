import { ethers } from 'ethers';
import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { generateVincentAbilitySessionSigs } from '@lit-protocol/vincent-app-sdk/abilityClient';

import type { PrepareResult, QuoteParams } from './types';
import VincentPrepareMetadata from '../../generated/vincent-prepare-metadata.json';

export const getSignedUniswapQuote = async ({
  quoteParams,
  ethersSigner,
  litNodeClient,
}: {
  quoteParams: QuoteParams;
  ethersSigner: ethers.Signer;
  litNodeClient: LitNodeClient;
}) => {
  const sessionSigs = await generateVincentAbilitySessionSigs({ ethersSigner, litNodeClient });

  const result = await litNodeClient.executeJs({
    ipfsId: VincentPrepareMetadata.ipfsCid,
    sessionSigs,
    jsParams: {
      quoteParams,
    },
  });

  if (!result.success) {
    throw new Error(JSON.stringify(result));
  }

  const parsedResult = JSON.parse(result.response as string) as PrepareResult;

  if (!parsedResult.success) {
    throw new Error(parsedResult.error);
  }

  return parsedResult.result;
};
