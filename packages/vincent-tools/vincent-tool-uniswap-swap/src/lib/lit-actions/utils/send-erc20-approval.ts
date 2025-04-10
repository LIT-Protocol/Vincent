import { ethers } from 'ethers';
import type { VincentToolPolicyResponse, VincentToolResponse } from '@lit-protocol/vincent-tool';

import { BASE_MAINNET_UNISWAP_V3_ROUTER, getGasParams, signTx } from '.';

const estimateGasForApproval = async (
    tokenInContract: ethers.Contract,
    uniswapV3RouterAddress: string,
    amountInSmallestUnit: ethers.BigNumber,
    pkpEthAddress: string
) => {
    // Get current gas data in parallel
    const [block, feeData, estimatedGas] = await Promise.all([
        tokenInContract.provider.getBlock('latest'),
        tokenInContract.provider.getFeeData(),
        tokenInContract.estimateGas.approve(
            uniswapV3RouterAddress,
            amountInSmallestUnit,
            { from: pkpEthAddress }
        )
    ]);

    return {
        ...await getGasParams(tokenInContract.provider, block, feeData, estimatedGas),
    };
}

export const sendErc20ApprovalTx = async (
    userRpcProvider: ethers.providers.JsonRpcProvider,
    userChainId: string,
    tokenInAddress: string,
    amountIn: string,
    tokenInDecimals: string,
    pkpEthAddress: string,
    pkpPubKey: string,
): Promise<VincentToolResponse | VincentToolPolicyResponse> => {
    const partialApprovalTxStringified = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'send approval tx gas estimation' },
        async () => {
            const tokenInContract = new ethers.Contract(
                tokenInAddress,
                ['function approve(address,uint256) external returns (bool)'],
                userRpcProvider
            );

            // Convert amountIn to token's smallest unit using input token's decimals
            const amountInSmallestUnit = ethers.utils.parseUnits(amountIn, tokenInDecimals);

            console.log(`Estimating gas for approval transaction...`);
            const { estimatedGas, maxFeePerGas, maxPriorityFeePerGas } = await estimateGasForApproval(
                tokenInContract,
                BASE_MAINNET_UNISWAP_V3_ROUTER,
                amountInSmallestUnit,
                pkpEthAddress
            );

            console.log(`Encoding approval transaction data...`);
            const approvalTxData = tokenInContract.interface.encodeFunctionData('approve', [
                BASE_MAINNET_UNISWAP_V3_ROUTER,
                amountInSmallestUnit,
            ]);

            console.log(`Creating approval transaction object...`);
            const partialApprovalTx = {
                data: approvalTxData,
                gasLimit: estimatedGas,
                maxFeePerGas: maxFeePerGas,
                maxPriorityFeePerGas: maxPriorityFeePerGas,
                nonce: await userRpcProvider.getTransactionCount(pkpEthAddress),
            };

            return JSON.stringify(partialApprovalTx);
        }
    );

    const partialApprovalTxObject = JSON.parse(partialApprovalTxStringified);
    const unsignedApprovalTx = {
        to: tokenInAddress,
        data: partialApprovalTxObject.data,
        value: ethers.BigNumber.from(0),
        gasLimit: ethers.BigNumber.from(partialApprovalTxObject.gasLimit),
        maxFeePerGas: ethers.BigNumber.from(partialApprovalTxObject.maxFeePerGas),
        maxPriorityFeePerGas: ethers.BigNumber.from(partialApprovalTxObject.maxPriorityFeePerGas),
        nonce: parseInt(partialApprovalTxObject.nonce),
        chainId: ethers.BigNumber.from(userChainId).toNumber(),
        type: 2,
    };

    console.log(`Signing approval transaction...`);
    const signedApprovalTx = await signTx(pkpPubKey, unsignedApprovalTx, 'erc20ApprovalSig');

    console.log(`Broadcasting approval transaction...`);
    const approvalTxHash = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'approvalTxSender' },
        async () => {
            try {
                const receipt = await userRpcProvider.sendTransaction(signedApprovalTx);
                return JSON.stringify({
                    status: 'success',
                    details: [
                        receipt.hash
                    ],
                });
            } catch (error) {
                return JSON.stringify({
                    status: 'error',
                    details: [
                        (error as Error).message || JSON.stringify(error)
                    ]
                });
            }
        }
    );

    return JSON.parse(approvalTxHash);
}