import { ethers } from 'ethers';
import type { VincentToolPolicyError, VincentToolPolicyResponse, VincentToolResponse } from '@lit-protocol/vincent-tool';

import { getGasParams, signTx, YELLOWSTONE_SPENDING_LIMIT_ADDRESS } from '.';

interface EstimateGasResponse {
    estimatedGas: ethers.BigNumber;
    maxFeePerGas: ethers.BigNumber;
    maxPriorityFeePerGas: ethers.BigNumber;
}

const tryParseSpendLimitExceededError = (spendingLimitContract: ethers.Contract, error: unknown): VincentToolPolicyError | unknown => {
    console.log(`Got error when trying to estimate gas for spending limit transaction:`, error);
    console.log('Attempting to parse error with Ethers to get revert reason...');

    const errorData = (error as any).error?.error?.data;
    if (!errorData) {
        throw error;
    }

    const ethersParsedError = spendingLimitContract.interface.parseError(errorData);
    if (ethersParsedError.name === 'SpendLimitExceeded') {
        const [user, appId, amount, limit] = ethersParsedError.args;
        console.log('Spending limit exceeded:', {
            user,
            appId: appId.toString(),
            amount: amount.toString(),
            limit: limit.toString()
        });

        return {
            allow: false,
            details: [
                'Spending limit exceeded',
            ]
        };
    }

    throw error;
}

const estimateGas = async (
    spendingLimitContract: ethers.Contract,
    appId: string,
    amountInUsd: ethers.BigNumber,
    maxSpendingLimitInUsdCents: ethers.BigNumber,
    spendingLimitDuration: ethers.BigNumber,
    pkpEthAddress: string,
): Promise<EstimateGasResponse | VincentToolPolicyError> => {
    console.log(`Making gas estimation call...`);
    try {
        console.log('Getting block, gas price, and estimated gas...');
        const [block, feeData, estimatedGas] = await Promise.all([
            spendingLimitContract.provider.getBlock('latest'),
            spendingLimitContract.provider.getFeeData(),
            spendingLimitContract.estimateGas.spend(
                appId,
                amountInUsd,
                maxSpendingLimitInUsdCents,
                spendingLimitDuration,
                { from: pkpEthAddress }
            )
        ]);

        return {
            ...await getGasParams(spendingLimitContract.provider, block, feeData, estimatedGas),
        };
    } catch (error: unknown) {
        return tryParseSpendLimitExceededError(spendingLimitContract, error) as VincentToolPolicyError;
    }
}

export const sendSpendTx = async (
    yellowstoneProvider: ethers.providers.JsonRpcProvider,
    appId: string,
    amountInUsd: ethers.BigNumber,
    maxSpendingLimitInUsdCents: ethers.BigNumber,
    spendingLimitDuration: ethers.BigNumber,
    pkpEthAddress: string,
    pkpPubKey: string,
): Promise<VincentToolResponse | VincentToolPolicyResponse> => {
    const SPENDING_LIMIT_ABI = [
        `function checkLimit(address user, uint256 appId, uint256 amountToSpend, uint256 userMaxSpendLimit, uint256 duration) view returns (bool)`,
        `function spend(uint256 appId, uint256 amount, uint256 userMaxSpendLimit, uint256 duration)`,
        `error SpendLimitExceeded(address user, uint256 appId, uint256 amount, uint256 limit)`,
        `error ZeroAppIdNotAllowed(address user)`,
        `error ZeroDurationQuery(address user)`
    ];
    const spendingLimitContract = new ethers.Contract(
        YELLOWSTONE_SPENDING_LIMIT_ADDRESS,
        SPENDING_LIMIT_ABI,
        yellowstoneProvider
    );

    const buildPartialSpendTxResponse = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'send spend tx gas estimation' },
        async () => {
            console.log(`Preparing transaction to send to Spending Limit Contract: ${YELLOWSTONE_SPENDING_LIMIT_ADDRESS}`);

            console.log(`Estimating gas for spending limit transaction...`);
            const estimatedGasResponse = await estimateGas(
                spendingLimitContract,
                appId,
                amountInUsd,
                maxSpendingLimitInUsdCents,
                spendingLimitDuration,
                pkpEthAddress
            );

            if ('allow' in estimatedGasResponse && !estimatedGasResponse.allow) {
                return JSON.stringify(estimatedGasResponse);
            }

            const { estimatedGas, maxFeePerGas, maxPriorityFeePerGas } = estimatedGasResponse as EstimateGasResponse;

            console.log(`Encoding transaction data...`);
            const txData = spendingLimitContract.interface.encodeFunctionData('spend', [
                appId,
                amountInUsd,
                maxSpendingLimitInUsdCents,
                spendingLimitDuration,
            ]);

            console.log(`Creating transaction object...`);
            const partialSpendTx = {
                data: txData,
                gasLimit: estimatedGas,
                maxFeePerGas,
                maxPriorityFeePerGas,
                nonce: await yellowstoneProvider.getTransactionCount(pkpEthAddress),
            };

            return JSON.stringify(partialSpendTx);
        }
    );

    const parsedPartialSpendTxResponse = JSON.parse(buildPartialSpendTxResponse);
    if ('allow' in parsedPartialSpendTxResponse && !parsedPartialSpendTxResponse.allow) {
        return parsedPartialSpendTxResponse;
    }

    const unsignedSpendTx = {
        to: YELLOWSTONE_SPENDING_LIMIT_ADDRESS,
        data: parsedPartialSpendTxResponse.data,
        value: ethers.BigNumber.from(0),
        gasLimit: ethers.BigNumber.from(parsedPartialSpendTxResponse.gasLimit),
        maxFeePerGas: ethers.BigNumber.from(parsedPartialSpendTxResponse.maxFeePerGas),
        maxPriorityFeePerGas: ethers.BigNumber.from(parsedPartialSpendTxResponse.maxPriorityFeePerGas),
        nonce: parseInt(parsedPartialSpendTxResponse.nonce),
        chainId: ethers.BigNumber.from(175188).toNumber(),
        type: 2,
    };

    console.log(`Signing spend transaction...`);
    const signedSpendTx = await signTx(pkpPubKey, unsignedSpendTx, 'spendingLimitSig');

    console.log(`Broadcasting spend transaction...`);
    const spendTxResponse = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'spendTxSender' },
        async () => {
            try {
                const receipt = await yellowstoneProvider.sendTransaction(signedSpendTx);
                return JSON.stringify({
                    status: 'success',
                    details: [
                        receipt.hash,
                    ]
                });
            } catch (error: unknown) {
                return tryParseSpendLimitExceededError(spendingLimitContract, error);
            }
        }
    );
    console.log(`Spend transaction response: ${spendTxResponse}`);

    let parsedSpendTxResponse;
    try {
        parsedSpendTxResponse = JSON.parse(spendTxResponse as string);
    } catch (error) {
        throw new Error('Invalid spend transaction response, failed to parse as JSON:', spendTxResponse);
    }

    if (parsedSpendTxResponse.status === 'success') {
        return {
            status: 'success',
            details: [
                parsedSpendTxResponse.details[0],
            ]
        };
    } else if ('allow' in parsedSpendTxResponse && !parsedSpendTxResponse.allow) {
        return {
            allow: false,
            details: parsedSpendTxResponse.details
        };
    } else {
        throw new Error('Invalid spend transaction response:', spendTxResponse);
    }
}