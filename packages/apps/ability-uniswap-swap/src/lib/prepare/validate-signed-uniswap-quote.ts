import { ethers } from 'ethers';
import deterministicJsonStringify from 'json-stable-stringify';

import { PrepareSuccessResult } from './types';

export const validateSignedUniswapQuote = ({
  prepareSuccessResult,
  expectedSignerEthAddress,
}: {
  prepareSuccessResult: PrepareSuccessResult;
  expectedSignerEthAddress: string;
}) => {
  const deterministicallyStringifiedQuote = deterministicJsonStringify(prepareSuccessResult.quote);
  if (!deterministicallyStringifiedQuote) {
    throw new Error('Failed to stringify Uniswap quote');
  }

  const messageToSign = deterministicallyStringifiedQuote;
  console.log('messageToSign', messageToSign);

  const messageHash = ethers.utils.hashMessage(messageToSign);
  console.log('messageHash', messageHash);

  const recoveredAddress = ethers.utils.recoverAddress(messageHash, prepareSuccessResult.signature);
  if (recoveredAddress !== expectedSignerEthAddress) {
    throw new Error(
      `Signature validation failed: recovered address ${recoveredAddress} does not match expected signer address ${expectedSignerEthAddress}`,
    );
  }
};
