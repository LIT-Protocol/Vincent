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

  const { ipfsCid, pkpPublicKey } = VincentPrepareMetadata;
  if (!ipfsCid) {
    throw new Error('Prepare Lit Action IPFS CID is not set');
  }
  if (!pkpPublicKey) {
    throw new Error('Prepare Lit Action PKP Public Key is not set');
  }

  const result = await litNodeClient.executeJs({
    ipfsId: ipfsCid,
    sessionSigs,
    jsParams: {
      quoteParams,
      pkpPublicKey: pkpPublicKey.replace(/^0x/, ''),
    },
  });

  if (!result.signatures['prepare-uniswap-route-signature']) {
    throw new Error('No signature of Uniswap Quote from Prepare Lit Action');
  }

  if (!result.response) {
    throw new Error(`No response from Lit Action: ${JSON.stringify(result)}`);
  }

  const parsedResult = result.response as PrepareResult;

  if (!parsedResult.success) {
    throw new Error(parsedResult.error);
  }

  // Validate the signature
  const signature = result.signatures['prepare-uniswap-route-signature'];
  const { to, value, calldata, estimatedGasUsed, estimatedGasUsedUSD } = parsedResult.result;

  // The message that was signed (without the signature field)
  const messageToSign = JSON.stringify({
    to,
    value,
    calldata,
    estimatedGasUsed,
    estimatedGasUsedUSD,
  });

  // Verify the signature matches what was signed
  const messageHash = ethers.utils.hashMessage(messageToSign);
  const recoveredAddress = ethers.utils.recoverAddress(messageHash, signature.signature);
  const pkpEthAddress = ethers.utils.computeAddress('0x' + signature.publicKey);

  if (recoveredAddress !== pkpEthAddress) {
    throw new Error('Signature validation failed: recovered address does not match PKP address');
  }

  // Return the result with the actual signature from the signatures object
  return {
    ...parsedResult.result,
    signature: signature.signature,
    dataSigned: signature.dataSigned,
    signerPublicKey: signature.publicKey,
  };
};
