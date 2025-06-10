import {
  Abi,
  ContractFunctionRevertedError,
  decodeErrorResult,
  encodeFunctionData,
  parseAbi,
} from 'viem';
import {
  getSpendingLimitContractInstance,
  SPENDING_LIMIT_CONTRACT_ABI,
  SPENDING_LIMIT_CONTRACT_ADDRESS,
} from './spending-limit-contract';
import { createChronicleYellowstoneViemClient } from './viem-chronicle-yellowstone-client';
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
  const chronicleYellowstoneProvider = createChronicleYellowstoneViemClient();
  const spendingLimitContractAbi = parseAbi(SPENDING_LIMIT_CONTRACT_ABI);

  const buildPartialSpendTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'send spend tx gas estimation' },
    async () => {
      console.log(
        `Preparing transaction to send to Spending Limit Contract: ${SPENDING_LIMIT_CONTRACT_ADDRESS} (sendSpendTx)`,
      );

      try {
        console.log(`Estimating gas for spending limit transaction...`);
        const estimatedGas = await spendingLimitContract.estimateGas.spend(
          [
            BigInt(appId),
            BigInt(amountSpentUsd),
            BigInt(maxSpendingLimitInUsd),
            BigInt(spendingLimitDuration),
          ],
          { account: pkpEthAddress as `0x${string}` },
        );

        const { maxFeePerGas, maxPriorityFeePerGas } =
          await chronicleYellowstoneProvider.estimateFeesPerGas();

        const txData = encodeFunctionData({
          abi: spendingLimitContractAbi,
          functionName: 'spend',
          args: [
            BigInt(appId),
            BigInt(amountSpentUsd),
            BigInt(maxSpendingLimitInUsd),
            BigInt(spendingLimitDuration),
          ],
        });

        return JSON.stringify({
          status: 'success',
          data: txData,
          gasLimit: estimatedGas.toString(),
          maxFeePerGas: maxFeePerGas.toString(),
          maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
          nonce: await chronicleYellowstoneProvider
            .getTransactionCount({
              address: pkpEthAddress as `0x${string}`,
            })
            .toString(),
        });
      } catch (error) {
        return attemptToDecodeSpendLimitExceededError(error, spendingLimitContractAbi);
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

  const unsignedSpendTx = {
    to: SPENDING_LIMIT_CONTRACT_ADDRESS,
    data: data as `0x${string}`,
    value: 0n,
    gas: BigInt(gasLimit),
    maxFeePerGas: BigInt(maxFeePerGas),
    maxPriorityFeePerGas: BigInt(maxPriorityFeePerGas),
    nonce: Number(nonce),
    chainId: 175188,
    type: 'eip1559',
  } as const;

  console.log(`Signing spend transaction: ${safeStringify(unsignedSpendTx)} (sendSpendTx)`);
  const signedSpendTx = await signTx({
    pkpPublicKey: pkpPubKey,
    tx: unsignedSpendTx,
    sigName: 'spendingLimitSig',
  });

  console.log(`Broadcasting spend transaction...`);
  const spendTxResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'spendTxSender' },
    async () => {
      try {
        const txHash = await chronicleYellowstoneProvider.sendRawTransaction({
          serializedTransaction: signedSpendTx as `0x${string}`,
        });
        return JSON.stringify({
          status: 'success',
          txHash,
        });
      } catch (error: unknown) {
        return attemptToDecodeSpendLimitExceededError(error, spendingLimitContractAbi);
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
    return value;
  });
};

const attemptToDecodeSpendLimitExceededError = (error: unknown, spendingLimitContractAbi: Abi) => {
  if (error instanceof ContractFunctionRevertedError && error.data) {
    try {
      const decoded = decodeErrorResult({
        abi: spendingLimitContractAbi,
        data: error.data as unknown as `0x${string}`,
      });

      if (decoded.errorName === 'SpendLimitExceeded' && decoded.args) {
        const [user, appId, amount, limit] = decoded.args as [string, bigint, bigint, bigint];
        return JSON.stringify({
          status: 'error',
          error: `Spending limit exceeded. User: ${user}, App ID: ${appId.toString()}, Attempted spend amount: ${amount.toString()}, Daily spend limit: ${limit.toString()}`,
        });
      }
    } catch (decodingError: unknown) {
      return JSON.stringify({
        status: 'error',
        error: `Failed to decode revert reason: ${decodingError}`,
      });
    }
  }

  return JSON.stringify({
    status: 'error',
    error,
  });
};
