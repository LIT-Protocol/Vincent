import { ethers } from 'ethers';
import type { VincentToolPolicyResponse, VincentToolResponse } from '@lit-protocol/vincent-tool';

import { type AddressesByChainIdResponse, getAddressesByChainId, signTx } from '.';

const estimateGasForApproval = async (
    tokenInContract: ethers.Contract,
    uniswapV3RouterAddress: string,
    amountInSmallestUnit: ethers.BigNumber,
    pkpEthAddress: string,
) => {
    let estimatedGas = await tokenInContract.estimateGas.approve(
        uniswapV3RouterAddress,
        amountInSmallestUnit,
        { from: pkpEthAddress }
    );

    // Add 10% buffer to estimated gas
    estimatedGas = estimatedGas.mul(110).div(100);

    // Get current gas data
    const [block, gasPrice] = await Promise.all([
        tokenInContract.provider.getBlock('latest'),
        tokenInContract.provider.getGasPrice()
    ]);

    // Use a more conservative max fee per gas calculation
    const baseFeePerGas = block.baseFeePerGas || gasPrice;
    const maxFeePerGas = baseFeePerGas.mul(150).div(100); // 1.5x base fee
    const maxPriorityFeePerGas = gasPrice.div(10); // 0.1x gas price

    return {
        estimatedGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
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
            const addressByChainIdResponse = getAddressesByChainId(userChainId);

            if ('status' in addressByChainIdResponse && addressByChainIdResponse.status === 'error') {
                return addressByChainIdResponse;
            }

            const { UNISWAP_V3_ROUTER } = addressByChainIdResponse as AddressesByChainIdResponse;

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
                UNISWAP_V3_ROUTER!,
                amountInSmallestUnit,
                pkpEthAddress
            );

            console.log(`Encoding approval transaction data...`);
            const approvalTxData = tokenInContract.interface.encodeFunctionData('approve', [
                UNISWAP_V3_ROUTER!,
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
            const receipt = await userRpcProvider.sendTransaction(signedApprovalTx);
            return receipt.hash;
        }
    );

    console.log(`Approval transaction hash: ${approvalTxHash}`);

    return {
        status: 'success',
        details: [
            approvalTxHash,
        ]
    };
}