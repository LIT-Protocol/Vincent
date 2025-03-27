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

  const tokenInfoStringified = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'get token info' },
    async () => {
      const tokenInInfo = await getErc20Info(userRpcProvider, toolParams.tokenIn);
      const tokenOutInfo = await getErc20Info(userRpcProvider, toolParams.tokenOut);

      return JSON.stringify({
        tokenInDecimals: tokenInInfo.decimals.toString(),
        tokenOutDecimals: tokenOutInfo.decimals.toString(),
      });
    }
  );

  const tokenInfoObject = JSON.parse(tokenInfoStringified);
  const tokenInDecimals = tokenInfoObject.tokenInDecimals;
  const tokenOutDecimals = tokenInfoObject.tokenOutDecimals;

  await validateUserToolPolicies(
    yellowstoneRpcProvider,
    toolParams.rpcUrl,
    delegateeAddress,
    pkpInfo,
    toolIpfsCid,
    {
      ...toolParams,
      tokenInDecimals,
      tokenOutDecimals,
    }
  );

  const swapTxHash = await sendUniswapTx(
    userRpcProvider,
    toolParams.chainId,
    toolParams.tokenIn,
    toolParams.tokenOut,
    toolParams.amountIn,
    tokenInDecimals,
    tokenOutDecimals,
    toolParams.pkpEthAddress,
    pkpInfo.publicKey,
  );

  Lit.Actions.setResponse({
    response: JSON.stringify({
      status: 'success',
      swapTxHash,
    }),
  });
})();