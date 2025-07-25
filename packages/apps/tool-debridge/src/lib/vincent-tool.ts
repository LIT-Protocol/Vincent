import { createVincentTool, supportedPoliciesForTool } from '@lit-protocol/vincent-tool-sdk';
import { laUtils } from '@lit-protocol/vincent-scaffold-sdk';
import { ethers } from 'ethers';

import {
  toolParamsSchema,
  precheckSuccessSchema,
  precheckFailSchema,
  executeSuccessSchema,
  executeFailSchema,
} from './schemas';
import {
  DEBRIDGE_CONTRACTS,
  validateChainId,
  validateAddress,
  getTokenBalance,
  checkAndApproveToken,
  isNativeToken,
  callDeBridgeAPI,
  getRpcUrl,
} from './helpers';

export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/vincent-tool-debridge' as const,
  toolDescription: 'A Vincent tool for DeBridge protocol operations (Transfer, Swap)',
  toolParamsSchema,
  supportedPolicies: supportedPoliciesForTool([]),

  precheckSuccessSchema,
  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ toolParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    const logPrefix = '[@lit-protocol/vincent-tool-debridge/precheck]';
    console.log(`${logPrefix} Starting precheck with params:`, toolParams);

    const {
      sourceChain,
      destinationChain,
      sourceToken,
      destinationToken,
      amount,
      recipientAddress,
      rpcUrl,
    } = toolParams;

    try {
      // Validate chain IDs
      if (!validateChainId(sourceChain)) {
        return fail({ error: `Invalid source chain ID: ${sourceChain}` });
      }
      if (!validateChainId(destinationChain)) {
        return fail({
          error: `Invalid destination chain ID: ${destinationChain}`,
        });
      }

      // Validate addresses
      if (!validateAddress(sourceToken)) {
        return fail({ error: `Invalid source token address: ${sourceToken}` });
      }
      if (!validateAddress(destinationToken)) {
        return fail({
          error: `Invalid destination token address: ${destinationToken}`,
        });
      }
      if (!validateAddress(recipientAddress)) {
        return fail({
          error: `Invalid recipient address: ${recipientAddress}`,
        });
      }

      // Check if chains are different for bridging
      if (sourceChain === destinationChain) {
        return fail({
          error: 'Source and destination chains must be different for bridging',
        });
      }

      // Connect to provider
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const network = await provider.getNetwork();

      if (network.chainId.toString() !== sourceChain) {
        return fail({
          error: `RPC URL chain ID (${network.chainId}) does not match source chain ID (${sourceChain})`,
        });
      }

      // Get deBridge contract address for source chain
      const deBridgeContract = DEBRIDGE_CONTRACTS[sourceChain];
      if (!deBridgeContract) {
        return fail({
          error: `DeBridge contract not available on chain ${sourceChain}`,
        });
      }

      // Use PKP address for balance checks
      const pkpAddress = delegatorPkpInfo.ethAddress;

      // Parse amount
      let amountBN: ethers.BigNumber;
      try {
        amountBN = ethers.BigNumber.from(amount);
      } catch (error) {
        return fail({ error: `Invalid amount format: ${amount}` });
      }

      // Check user balance
      const balance = await getTokenBalance(provider, sourceToken, pkpAddress);
      console.log(
        `${logPrefix} PKP balance: ${balance.toString()}, Required: ${amountBN.toString()}`,
      );

      if (balance.lt(amountBN)) {
        return fail({
          error: `Insufficient balance. Have: ${balance.toString()}, Need: ${amountBN.toString()}`,
        });
      }

      // Check approval if needed (for ERC20 tokens)
      if (!isNativeToken(sourceToken)) {
        const { needsApproval, currentAllowance } = await checkAndApproveToken(
          provider,
          sourceToken,
          pkpAddress,
          deBridgeContract,
          amountBN,
        );

        if (needsApproval) {
          return fail({
            error: `Insufficient token allowance. Current allowance: ${currentAllowance.toString()}, Required: ${amountBN.toString()}. Please approve the token first using the ERC20 approval tool.`,
          });
        }

        console.log(
          `${logPrefix} Token approval verified: ${currentAllowance.toString()} >= ${amountBN.toString()}`,
        );
      }

      // Get quote from deBridge API
      console.log(`${logPrefix} Getting quote from deBridge API...`);

      const quoteParams = {
        srcChainId: sourceChain,
        srcChainTokenIn: sourceToken,
        srcChainTokenInAmount: amount,
        dstChainId: destinationChain,
        dstChainTokenOut: destinationToken,
        prependOperatingExpenses: 'true',
      };
      console.log(`${logPrefix} Quote params:`, quoteParams);

      let quoteData: any;
      try {
        quoteData = await callDeBridgeAPI('/dln/order/create-tx', 'GET', quoteParams);
        console.log(`${logPrefix} Quote received:`, quoteData);
      } catch (error: any) {
        return fail({
          error: `Failed to get quote from deBridge: ${error.message}`,
        });
      }

      // Calculate total cost
      const protocolFee = ethers.BigNumber.from(quoteData.fixFee || '0');

      return succeed({
        data: {
          sourceChain,
          destinationChain,
          sourceToken,
          destinationToken,
          sourceAmount: amount,
          estimatedDestinationAmount: quoteData.estimation.dstChainTokenOut.amount,
          estimatedFees: {
            protocolFee: protocolFee.toString(),
          },
          estimatedExecutionTime: quoteData.estimation.estimatedTxExecutionTime || '300',
        },
      });
    } catch (error: any) {
      console.error(`${logPrefix} Unexpected error:`, error);
      return fail({ error: `Unexpected error: ${error.message}` });
    }
  },
  execute: async ({ toolParams }, { succeed, fail, delegation }) => {
    const logPrefix = '[@lit-protocol/vincent-tool-debridge/execute]';
    console.log(`${logPrefix} Starting execution with params:`, toolParams);

    const {
      sourceChain,
      destinationChain,
      sourceToken,
      destinationToken,
      amount,
      recipientAddress,
    } = toolParams;

    try {
      // Get PKP info
      const pkpPublicKey = delegation.delegatorPkpInfo.publicKey;
      const pkpAddress = ethers.utils.computeAddress(pkpPublicKey);

      console.log(`${logPrefix} PKP Address: ${pkpAddress}`);

      // Get RPC URL from Lit Actions
      const rpcUrl = await getRpcUrl(sourceChain);
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

      // Get deBridge contract address
      const deBridgeContract = DEBRIDGE_CONTRACTS[sourceChain];
      if (!deBridgeContract) {
        return fail({
          error: `DeBridge contract not available on chain ${sourceChain}`,
        });
      }

      // Parse amount
      const amountBN = ethers.BigNumber.from(amount);

      // Check approval if needed (for ERC20 tokens)
      if (!isNativeToken(sourceToken)) {
        const { needsApproval, currentAllowance } = await checkAndApproveToken(
          provider,
          sourceToken,
          pkpAddress,
          deBridgeContract,
          amountBN,
        );

        if (needsApproval) {
          return fail({
            error: `Insufficient token allowance. Current allowance: ${currentAllowance.toString()}, Required: ${amountBN.toString()}. Please approve the token first using the ERC20 approval tool.`,
          });
        }

        console.log(
          `${logPrefix} Token approval verified: ${currentAllowance.toString()} >= ${amountBN.toString()}`,
        );
      }

      // Get transaction data from deBridge API
      console.log(`${logPrefix} Getting transaction data from deBridge API...`);

      const createOrderParams = {
        srcChainId: sourceChain,
        srcChainTokenIn: sourceToken,
        srcChainTokenInAmount: amount,
        dstChainId: destinationChain,
        dstChainTokenOut: destinationToken,
        dstChainTokenOutRecipient: recipientAddress,
        srcChainOrderAuthorityAddress: pkpAddress,
        dstChainOrderAuthorityAddress: recipientAddress,
        affiliateFeePercent: '0',
        prependOperatingExpenses: 'true',
      };

      const orderDataResponse = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'serializedTxn' },
        async () => {
          let orderTxData: any;
          try {
            orderTxData = await callDeBridgeAPI('/dln/order/create-tx', 'GET', createOrderParams);
            console.log(`${logPrefix} Order transaction data received`);
          } catch (error: any) {
            return fail({
              error: `Failed to get order transaction data: ${error.message}`,
            });
          }

          console.log('Order transaction data:', orderTxData);

          const txn = {
            to: orderTxData.tx.to,
            data: orderTxData.tx.data,
            value: orderTxData.tx.value
              ? ethers.BigNumber.from(orderTxData.tx.value)
              : ethers.BigNumber.from('0'),
            chainId: Number(sourceChain),
          } as ethers.UnsignedTransaction;

          const txnRequest = {
            ...txn,
            from: pkpAddress,
          } as ethers.providers.TransactionRequest;

          // console.log("Transaction data:", txn);

          // Step 2: Estimate gas using the provider
          const gasLimit = await provider.estimateGas(txnRequest);

          const nonce = await provider.getTransactionCount(pkpAddress);
          const gasPrice = await provider.getGasPrice();
          // console.log("RunOnce Gas price:", gasPrice.toString());

          txn.gasLimit = gasLimit;
          txn.gasPrice = gasPrice;
          txn.nonce = nonce;

          return JSON.stringify({
            serializedTxn: ethers.utils.serializeTransaction(txn),
            orderId: orderTxData.orderId,
          });
        },
      );

      //console.log(`${logPrefix} Order data response:`, orderDataResponse);

      const parsedOrderDataResponse = JSON.parse(orderDataResponse);
      const toSign = ethers.utils.parseTransaction(parsedOrderDataResponse.serializedTxn);

      // strip the empty signature
      delete toSign.v;
      delete toSign.r;
      delete toSign.s;

      // Execute the bridge transaction
      console.log(`${logPrefix} Signing bridge transaction...`, toSign);

      const signedTx = await laUtils.transaction.primitive.signTx({
        sigName: 'debridgeCreateOrder',
        pkpPublicKey,
        tx: toSign,
      });

      console.log('Signed transaction:', signedTx);

      // Step 4: Send the transaction
      const txHash = await laUtils.transaction.primitive.sendTx(provider, signedTx);
      console.log('Transaction sent:', txHash);

      console.log(`${logPrefix} Bridge transaction successful. Hash: ${txHash}`);

      return succeed({
        data: {
          txHash,
          sourceChain,
          destinationChain,
          sourceToken,
          destinationToken,
          sourceAmount: amount,
          orderId: parsedOrderDataResponse.orderId,
        },
      });
    } catch (error: any) {
      console.error(`${logPrefix} Execution error:`, error);
      return fail({ error: `Execution failed: ${error.message}` });
    }
  },
});
