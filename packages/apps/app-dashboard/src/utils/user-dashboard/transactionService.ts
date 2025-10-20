import { ethers } from 'ethers';
import {
  JsonRpcProvider as V6JsonRpcProvider,
  Contract as V6Contract,
  TransactionReceipt,
  TransactionRequest,
} from 'ethers-v6';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import * as Sentry from '@sentry/react';

interface TokenDetails {
  address: string;
  symbol: string;
  decimals: number;
}

interface TransactionResult {
  success: boolean;
  hash: string;
  error?: string;
  receipt?: TransactionReceipt;
}

interface SendTransactionParams {
  pkpWallet: PKPEthersWallet;
  txOptions: TransactionRequest;
  provider: V6JsonRpcProvider;
}

interface SendNativeTransactionParams {
  pkpWallet: PKPEthersWallet;
  amount: ethers.BigNumber;
  recipientAddress: string;
  provider: V6JsonRpcProvider;
}

interface SendTokenTransactionParams {
  pkpWallet: PKPEthersWallet;
  tokenDetails: TokenDetails;
  amount: ethers.BigNumber;
  recipientAddress: string;
  provider: V6JsonRpcProvider;
}

/**
 * Helper function to send a transaction with automatic retry on "replacement fee too low" error
 */
async function sendTransaction({
  pkpWallet,
  txOptions,
  provider,
}: SendTransactionParams): Promise<TransactionResult> {
  try {
    const tx = await pkpWallet.sendTransaction(txOptions);
    const receipt = await provider.waitForTransaction(tx.hash, 1);

    return {
      success: receipt ? receipt.status === 1 : false,
      hash: tx.hash,
      receipt: receipt || undefined,
    };
  } catch (error: unknown) {
    Sentry.captureException(error, {
      extra: {
        context: 'transactionService.sendTransaction',
        to: txOptions.to,
        value: txOptions.value?.toString(),
        pkpAddress: pkpWallet.address,
      },
    });
    if ((error as Error).message.includes('insufficient funds for intrinsic transaction cost')) {
      return {
        success: false,
        hash: '',
        error: 'Insufficient funds to pay for transaction. Please add more funds to your wallet.',
      };
    } else {
      return {
        success: false,
        hash: '',
        error: (error as Error).message || 'Failed to send transaction',
      };
    }
  }
}

/**
 * Sends a native asset transfer transaction
 */
export async function sendNativeTransaction({
  pkpWallet,
  amount,
  recipientAddress,
  provider,
}: SendNativeTransactionParams): Promise<TransactionResult> {
  try {
    const nativeBalance = await pkpWallet.getBalance();
    if (amount.gt(nativeBalance)) {
      return {
        success: false,
        hash: '',
        error: `Insufficient balance to withdraw specified amount and pay for current gas fees.`,
      };
    }

    const feeData = await provider.getFeeData();

    const txOptions: any = {
      to: recipientAddress,
      value: amount,
      type: 2,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    };

    return await sendTransaction({
      pkpWallet,
      txOptions,
      provider,
    });
  } catch (error: unknown) {
    Sentry.captureException(error, {
      extra: {
        context: 'transactionService.sendNativeTransaction',
        recipientAddress,
        amount: amount.toString(),
        pkpAddress: pkpWallet.address,
      },
    });
    return {
      success: false,
      hash: '',
      error: (error as Error).message || 'Failed to send native asset',
    };
  }
}

/**
 * Sends an ERC-20 token transfer transaction
 */
export async function sendTokenTransaction({
  pkpWallet,
  tokenDetails,
  amount,
  recipientAddress,
  provider,
}: SendTokenTransactionParams): Promise<TransactionResult> {
  try {
    const feeData = await provider.getFeeData();
    const tokenContract = new V6Contract(
      tokenDetails.address,
      ['function transfer(address to, uint256 amount) returns (bool)'],
      provider,
    );

    let gasLimit;
    try {
      // For V6, we need to estimate gas differently
      const estimatedGas = await provider.estimateGas({
        to: tokenDetails.address,
        data: tokenContract.interface.encodeFunctionData('transfer', [
          recipientAddress,
          BigInt(amount.toString()),
        ]),
        from: await pkpWallet.getAddress(),
      });

      // Add 10% buffer to estimated gas for token transfers
      gasLimit = ethers.BigNumber.from(estimatedGas.toString()).mul(110).div(100);
      console.log('Estimated gas for token transfer:', gasLimit.toString());
    } catch (err: unknown) {
      Sentry.captureException(err, {
        extra: {
          context: 'transactionService.sendTokenTransaction.estimateGas',
          tokenAddress: tokenDetails.address,
          tokenSymbol: tokenDetails.symbol,
          recipientAddress,
          amount: amount.toString(),
          pkpAddress: pkpWallet.address,
        },
      });
      return {
        success: false,
        hash: '',
        error: `Failed to estimate gas for transaction: ${(err as Error).message}`,
      };
    }

    const data = tokenContract.interface.encodeFunctionData('transfer', [
      recipientAddress,
      BigInt(amount.toString()),
    ]);

    // Prepare transaction options for EIP-1559
    const txOptions: any = {
      to: tokenDetails.address,
      value: 0,
      data: data,
      gasLimit: gasLimit,
      type: 2,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    };

    const nativeBalance = await pkpWallet.getBalance();
    const gasCost = gasLimit.mul(feeData.maxFeePerGas!);

    if (nativeBalance.lt(gasCost)) {
      return {
        success: false,
        hash: '',
        error: `Insufficient native balance for gas fees. Need ${ethers.utils.formatUnits(gasCost, 'ether')} ETH for gas.`,
      };
    }

    return await sendTransaction({
      pkpWallet,
      txOptions,
      provider,
    });
  } catch (error: unknown) {
    console.error('Error sending token transaction:', error);
    Sentry.captureException(error, {
      extra: {
        context: 'transactionService.sendTokenTransaction',
        tokenAddress: tokenDetails.address,
        tokenSymbol: tokenDetails.symbol,
        recipientAddress,
        amount: amount.toString(),
        pkpAddress: pkpWallet.address,
      },
    });
    return {
      success: false,
      hash: '',
      error: (error as Error).message || 'Failed to send token',
    };
  }
}
