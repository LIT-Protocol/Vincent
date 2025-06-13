import { ethers } from 'ethers';
import {
  getSpendingLimitContractInstance,
  SPENDING_LIMIT_CONTRACT_ADDRESS,
} from './spending-limit-contract';
import { signTx } from './sign-tx';

declare const Lit: {
  Actions: {
    runOnce: (
      params: {
        waitForResponse: boolean;
        name: string;
      },
      callback: () => Promise<string>,
    ) => Promise<string>;
  };
};

export const sendSpendTx = async ({
  appId,
  amountSpentUsd,
  maxSpendingLimitInUsd,
  spendingLimitDuration,
  pkpEthAddress,
  pkpPubKey,
}: {
  appId: number;
  amountSpentUsd: number;
  maxSpendingLimitInUsd: number;
  spendingLimitDuration: number;
  pkpEthAddress: string;
  pkpPubKey: string;
}) => {
  const spendingLimitContract = getSpendingLimitContractInstance();

  const buildPartialSpendTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'send spend tx gas estimation' },
    async () => {
      console.log(
        `Preparing transaction to send to Spending Limit Contract: ${SPENDING_LIMIT_CONTRACT_ADDRESS} (sendSpendTx)`,
      );

      try {
        console.log(`Estimating gas for spending limit transaction...`);

        // Get current gas price and nonce
        const [feeData, nonce] = await Promise.all([
          spendingLimitContract.provider.getFeeData(),
          spendingLimitContract.provider.getTransactionCount(pkpEthAddress),
        ]);

        // Encode function data
        const txData = spendingLimitContract.interface.encodeFunctionData('spend', [
          BigInt(appId),
          BigInt(amountSpentUsd),
          BigInt(maxSpendingLimitInUsd),
          BigInt(spendingLimitDuration),
        ]);

        // Estimate gas
        const estimatedGas = await spendingLimitContract.estimateGas.spend(
          BigInt(appId),
          BigInt(amountSpentUsd),
          BigInt(maxSpendingLimitInUsd),
          BigInt(spendingLimitDuration),
          { from: pkpEthAddress },
        );

        console.log('fetching nonce for pkpEthAddress: ', pkpEthAddress, ' (sendSpendTx)');

        return JSON.stringify({
          status: 'success',
          data: txData,
          gasLimit: estimatedGas.toString(),
          maxFeePerGas: feeData.maxFeePerGas?.toString() || '0',
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString() || '0',
          nonce: nonce.toString(),
        });
      } catch (error) {
        return attemptToDecodeSpendLimitExceededError(error, spendingLimitContract);
      }
    },
  );

  const parsedBuildPartialSpendTxResponse = JSON.parse(buildPartialSpendTxResponse as string);
  if (parsedBuildPartialSpendTxResponse.status === 'error') {
    throw new Error(
      `Error estimating gas for spending limit transaction: ${parsedBuildPartialSpendTxResponse.error}`,
    );
  }

  const { gasLimit, maxFeePerGas, maxPriorityFeePerGas, nonce, data } =
    parsedBuildPartialSpendTxResponse;

  // Create ethers Transaction object
  const unsignedSpendTx: ethers.Transaction = {
    to: SPENDING_LIMIT_CONTRACT_ADDRESS,
    data: data,
    value: ethers.BigNumber.from(0),
    gasLimit: ethers.BigNumber.from(gasLimit),
    maxFeePerGas: ethers.BigNumber.from(maxFeePerGas),
    maxPriorityFeePerGas: ethers.BigNumber.from(maxPriorityFeePerGas),
    nonce: Number(nonce),
    chainId: 175188,
    type: 2, // EIP-1559 transaction type
  };

  console.log(`Signing spend transaction: ${safeStringify(unsignedSpendTx)} (sendSpendTx)`);
  const signedSpendTx = await signTx(pkpPubKey, unsignedSpendTx, 'spendingLimitSig');

  console.log(`Broadcasting spend transaction...`);
  const spendTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'spendTxSender' },
    async () => {
      try {
        const txResponse = await spendingLimitContract.provider.sendTransaction(signedSpendTx);
        return JSON.stringify({
          status: 'success',
          txHash: txResponse.hash,
        });
      } catch (error: unknown) {
        return attemptToDecodeSpendLimitExceededError(error, spendingLimitContract);
      }
    },
  );
  console.log(`Spend transaction response: ${spendTxResponse} (sendSpendTx)`);

  const parsedSpendTxResponse = JSON.parse(spendTxResponse as string);
  if (parsedSpendTxResponse.status === 'error') {
    throw new Error(`Error sending spend transaction: ${parsedSpendTxResponse.error}`);
  }

  return parsedSpendTxResponse.txHash;
};

const safeStringify = (obj: unknown): string => {
  return JSON.stringify(obj, (_, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    if (ethers.BigNumber.isBigNumber(value)) {
      return value.toString();
    }
    return value;
  });
};

const attemptToDecodeSpendLimitExceededError = (error: unknown, contract: ethers.Contract) => {
  try {
    // Check if it's an ethers revert error with data
    if (error && typeof error === 'object' && 'reason' in error) {
      const ethersError = error as any;

      // Try to decode custom error from error data
      if (ethersError.data) {
        try {
          const decoded = contract.interface.parseError(ethersError.data);

          if (decoded.name === 'SpendLimitExceeded' && decoded.args) {
            const [user, appId, amount, limit] = decoded.args;
            return JSON.stringify({
              status: 'error',
              error: `Spending limit exceeded. User: ${user}, App ID: ${appId.toString()}, Attempted spend amount: ${amount.toString()}, Daily spend limit: ${limit.toString()}`,
            });
          }
        } catch (parseError) {
          // If parsing fails, fall through to generic error handling
        }
      }

      // Handle standard revert with reason string
      if (ethersError.reason) {
        return JSON.stringify({
          status: 'error',
          error: `Contract reverted: ${ethersError.reason}`,
        });
      }
    }

    // Handle ethers CALL_EXCEPTION errors
    if (error && typeof error === 'object' && 'code' in error) {
      const ethersError = error as any;
      if (ethersError.code === 'CALL_EXCEPTION' && ethersError.errorArgs) {
        const [user, appId, amount, limit] = ethersError.errorArgs;
        return JSON.stringify({
          status: 'error',
          error: `Spending limit exceeded. User: ${user}, App ID: ${appId.toString()}, Attempted spend amount: ${amount.toString()}, Daily spend limit: ${limit.toString()}`,
        });
      }
    }
  } catch (decodingError: unknown) {
    return JSON.stringify({
      status: 'error',
      error: `Failed to decode revert reason: ${decodingError}`,
    });
  }

  return JSON.stringify({
    status: 'error',
    error: error?.toString() || 'Unknown error',
  });
};
