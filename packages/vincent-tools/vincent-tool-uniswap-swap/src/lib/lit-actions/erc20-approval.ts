/* eslint-disable */
import { NETWORK_CONFIG, getPkpInfo, validateUserToolPolicies } from '@lit-protocol/vincent-tool';
import { ethers } from "ethers";

import { getErc20Info, sendErc20ApprovalTx } from "./utils";

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

        const response = await validateUserToolPolicies(
            yellowstoneRpcProvider,
            toolParams.rpcUrl,
            delegateeAddress,
            pkpInfo,
            toolIpfsCid,
            {
                ...toolParams,
            }
        );
        console.log(`validateUserToolPolicies response: ${JSON.stringify(response)}`);

        if (response.status === 'error') {
            Lit.Actions.setResponse({
                response: JSON.stringify(response),
            });

            return;
        }

        const tokenInInfo = await getErc20Info(userRpcProvider, toolParams.tokenIn);

        const approvalTxResponse = await sendErc20ApprovalTx(
            userRpcProvider,
            toolParams.chainId,
            toolParams.tokenIn,
            toolParams.amountIn,
            tokenInInfo.decimals.toString(),
            toolParams.pkpEthAddress,
            pkpInfo.publicKey,
        );

        if ('status' in approvalTxResponse && approvalTxResponse.status === 'error') {
            Lit.Actions.setResponse({
                response: JSON.stringify(approvalTxResponse),
            });

            return;
        }

        Lit.Actions.setResponse({
            response: JSON.stringify({
                status: 'success',
                details: [
                    approvalTxResponse.details[0],
                    `${pkpInfo.ethAddress} approved ${toolParams.amountIn} ${toolParams.tokenIn} for Uniswap V3 Router`,
                ],
            }),
        });
    } catch (error) {
        console.error('Error:', error);

        Lit.Actions.setResponse({
            response: JSON.stringify({
                status: 'error',
                details: [(error as Error).message || JSON.stringify(error)]
            }),
        });
    }
})();