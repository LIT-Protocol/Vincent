import { ethers } from 'ethers';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

interface TokenDetails {
  address: string;
  symbol: string;
  decimals: number;
}

interface TransactionResult {
  success: boolean;
  hash: string;
  error?: string;
  receipt?: ethers.providers.TransactionReceipt;
}

interface SendTransactionWithRetryParams {
  pkpWallet: PKPEthersWallet;
  txOptions: ethers.providers.TransactionRequest;
  provider: ethers.providers.JsonRpcProvider;
}

interface SendNativeTransactionParams {
  pkpWallet: PKPEthersWallet;
  amount: ethers.BigNumber;
  recipientAddress: string;
  provider: ethers.providers.JsonRpcProvider;
}

interface SendTokenTransactionParams {
  pkpWallet: PKPEthersWallet;
  tokenDetails: TokenDetails;
  amount: ethers.BigNumber;
  recipientAddress: string;
  provider: ethers.providers.JsonRpcProvider;
}

/**
 * Helper function to send a transaction with automatic retry on "replacement fee too low" error
 */
async function sendTransaction({
  pkpWallet,
  txOptions,
  provider,
}: SendTransactionWithRetryParams): Promise<TransactionResult> {
  try {
    const tx = await pkpWallet.sendTransaction(txOptions);
    const receipt = await provider.waitForTransaction(tx.hash, 1);

    return {
      success: receipt.status === 1,
      hash: tx.hash,
      receipt
    };
  } catch (error: unknown) {
    if ((error as Error).message.includes('insufficient funds for intrinsic transaction cost')) {
      return {
        success: false,
        hash: '',
        error: 'Insufficient funds to pay for transaction. Please add more funds to your wallet.'
      };
    } else {
      return {
        success: false,
        hash: '',
        error: (error as Error).message || 'Failed to send transaction'
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
  provider
}: SendNativeTransactionParams): Promise<TransactionResult> {
  try {
    const nativeBalance = await pkpWallet.getBalance();
    if (amount.gt(nativeBalance)) {
      return {
        success: false,
        hash: '',
        error: `Insufficient balance to withdraw specified amount and pay for current gas fees.`
      };
    }

    const txOptions = {
      to: recipientAddress,
      value: amount
    };

    return await sendTransaction({
      pkpWallet,
      txOptions,
      provider,
    });
  } catch (error: unknown) {
    return {
      success: false,
      hash: '',
      error: (error as Error).message || 'Failed to send native asset'
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
  provider
}: SendTokenTransactionParams): Promise<TransactionResult> {
  try {

    const gasPrice = await provider.getGasPrice();

    const tokenContract = new ethers.Contract(
      tokenDetails.address,
      ["function transfer(address to, uint256 amount) returns (bool)"],
      provider
    );

    let gasLimit;
    try {
      const tokenWithSigner = tokenContract.connect(pkpWallet as unknown as ethers.Signer);

      const estimatedGas = await tokenWithSigner.estimateGas.transfer(
        recipientAddress,
        amount
      );

      // Add 10% buffer to estimated gas for token transfers
      gasLimit = estimatedGas.mul(110).div(100);
      console.log('Estimated gas for token transfer:', gasLimit.toString());
    } catch (err: unknown) {
      return {
        success: false,
        hash: '',
        error: `Failed to estimate gas for transaction: ${(err as Error).message}`
      };
    }

    const data = tokenContract.interface.encodeFunctionData(
      'transfer',
      [recipientAddress, amount]
    );

    const txOptions = {
      to: tokenDetails.address,
      value: 0,
      data: data,
      gasLimit: gasLimit,
      gasPrice: gasPrice
    };

    const nativeBalance = await pkpWallet.getBalance();
    const gasCost = gasLimit.mul(gasPrice);

    if (nativeBalance.lt(gasCost)) {
      return {
        success: false,
        hash: '',
        error: `Insufficient native balance for gas fees. Need ${ethers.utils.formatUnits(gasCost, tokenDetails.decimals)} ${tokenDetails.symbol} for gas.`
      };
    }

    return await sendTransaction({
      pkpWallet,
      txOptions,
      provider
    });
  } catch (error: unknown) {
    console.error('Error sending token transaction:', error);
    return {
      success: false,
      hash: '',
      error: (error as Error).message || 'Failed to send token'
    };
  }
}
