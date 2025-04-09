/* eslint-disable */
import { NETWORK_CONFIG, validateUserToolPolicies, getPkpInfo } from '@lit-protocol/vincent-tool';
import { ethers } from 'ethers';

import { getErc20Info, sendUniswapTx } from './utils';

declare global {
  const LIT_NETWORK: string;

  const Lit: any;
  const LitAuth: any;

  // Required Input parameters given by the executor of the Lit Action
  type BaseToolParams = {
    pkpEthAddress: string;
    rpcUrl: string;
    chainId: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
  };

  type AdditionalParams = {
    tokenInDecimals: string;
    tokenOutDecimals: string;
  };

  const toolParams: BaseToolParams & AdditionalParams;
}

(async () => {
  try {
    console.log(`Using Lit Network: ${LIT_NETWORK}`);

    const networkConfig = NETWORK_CONFIG[LIT_NETWORK as keyof typeof NETWORK_CONFIG];
    console.log(
      `Using Vincent Contract Address: ${networkConfig.vincentAddress}`
    );
    console.log(
      `Using Pubkey Router Address: ${networkConfig.pubkeyRouterAddress}`
    );

    const delegateeAddress = ethers.utils.getAddress(LitAuth.authSigAddress);
    const toolIpfsCid = LitAuth.actionIpfsIds[0];
    const userRpcProvider = new ethers.providers.JsonRpcProvider(toolParams.rpcUrl);
    const yellowstoneRpcProvider = new ethers.providers.JsonRpcProvider(
      await Lit.Actions.getRpcUrl({
        chain: 'yellowstone',
      })
    );

    const pkpInfo = await getPkpInfo(networkConfig.pubkeyRouterAddress, yellowstoneRpcProvider, toolParams.pkpEthAddress);
    console.log(`Retrieved PKP info for PKP ETH Address: ${toolParams.pkpEthAddress}: ${JSON.stringify(pkpInfo)}`);

    const tokenInInfo = await getErc20Info(userRpcProvider, toolParams.tokenIn);
    const tokenOutInfo = await getErc20Info(userRpcProvider, toolParams.tokenOut);

    const response = await validateUserToolPolicies(
      yellowstoneRpcProvider,
      toolParams.rpcUrl,
      delegateeAddress,
      pkpInfo,
      toolIpfsCid,
      {
        ...toolParams,
        tokenInDecimals: tokenInInfo.decimals.toString(),
        tokenOutDecimals: tokenOutInfo.decimals.toString(),
      }
    );
    console.log(`validateUserToolPolicies response: ${JSON.stringify(response)}`);

    if (response.status === 'error') {
      Lit.Actions.setResponse({
        response: JSON.stringify(response),
      });

      return;
    }

    const swapTxResponse = await sendUniswapTx(
      userRpcProvider,
      toolParams.chainId,
      toolParams.tokenIn,
      toolParams.tokenOut,
      toolParams.amountIn,
      tokenInInfo.decimals.toString(),
      tokenOutInfo.decimals.toString(),
      toolParams.pkpEthAddress,
      pkpInfo.publicKey,
    );

    if ('status' in swapTxResponse && swapTxResponse.status === 'error') {
      Lit.Actions.setResponse({
        response: JSON.stringify(swapTxResponse),
      });
    }

    Lit.Actions.setResponse({
      response: JSON.stringify({
        status: 'success',
        details: [
          swapTxResponse.details[0],
          `${pkpInfo.ethAddress} swapped ${toolParams.amountIn} ${toolParams.tokenIn} for ${toolParams.tokenOut}`,
        ],
      }),
    });
  } catch (error: unknown) {
    console.error('Error:', error);

    Lit.Actions.setResponse({
      response: JSON.stringify({
        status: 'error',
        details: [(error as Error).message || JSON.stringify(error)]
      }),
    });
  }
})();