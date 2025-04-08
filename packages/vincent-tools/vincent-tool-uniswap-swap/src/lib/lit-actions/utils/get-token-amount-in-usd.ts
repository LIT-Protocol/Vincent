import { ethers } from "ethers";
import { type VincentToolError } from "@lit-protocol/vincent-tool";

import { type AddressesByChainIdResponse, getAddressesByChainId, getEthUsdPrice, getUniswapQuote, UniswapQuoteResponse } from ".";

const calculateUsdValue = async (
    amountInWeth: ethers.BigNumber,
): Promise<{ amountInUsd: ethers.BigNumber } | VincentToolError> => {
    // Get ETH price in USD from Chainlink on Ethereum mainnet
    const ethUsdPriceResponse = await getEthUsdPrice();
    if ('status' in ethUsdPriceResponse && ethUsdPriceResponse.status === 'error') {
        return ethUsdPriceResponse;
    }

    const { ethPriceInUsd } = ethUsdPriceResponse as { ethPriceInUsd: ethers.BigNumber };

    console.log(`ETH price in USD (8 decimals): ${ethPriceInUsd.toString()}`);

    // Calculate USD value (8 decimals precision)
    const CHAINLINK_DECIMALS = 8;
    const WETH_DECIMALS = 18; // WETH decimals
    const amountInUsd = amountInWeth.mul(ethPriceInUsd).div(ethers.BigNumber.from(10).pow(WETH_DECIMALS));
    console.log(`Token amount in USD (8 decimals): $${ethers.utils.formatUnits(amountInUsd, CHAINLINK_DECIMALS)}`);

    return { amountInUsd };
};

export const getTokenAmountInUsd = async (
    userRpcProvider: ethers.providers.JsonRpcProvider,
    userChainId: string,
    amountIn: string,
    tokenInAddress: string,
    tokenInDecimals: string,
): Promise<{ amountInUsd: ethers.BigNumber } | VincentToolError> => {
    const addressByChainIdResponse = getAddressesByChainId(userChainId);

    if ('status' in addressByChainIdResponse && addressByChainIdResponse.status === 'error') {
        return addressByChainIdResponse;
    }

    const { WETH_ADDRESS } = addressByChainIdResponse as AddressesByChainIdResponse;

    // Special case for WETH - no need to get a quote since it's already in ETH terms
    if (tokenInAddress.toLowerCase() === WETH_ADDRESS!.toLowerCase()) {
        console.log(`Input token is WETH, using amount directly: ${amountIn}`);
        const amountInWeth = ethers.utils.parseUnits(amountIn, tokenInDecimals);
        return calculateUsdValue(amountInWeth);
    }

    console.log(`Getting ${amountIn.toString()} ${tokenInAddress} price in WETH from Uniswap...`);
    const uniswapQuoteResponse = await getUniswapQuote(
        userRpcProvider,
        userChainId,
        tokenInAddress,
        WETH_ADDRESS!,
        amountIn,
        tokenInDecimals,
        '18' // WETH decimals
    );

    if ('status' in uniswapQuoteResponse && uniswapQuoteResponse.status === 'error') {
        return uniswapQuoteResponse;
    }

    const { bestQuote } = uniswapQuoteResponse as UniswapQuoteResponse;
    console.log(`Amount in WETH: ${ethers.utils.formatUnits(bestQuote, 18)}`);

    return calculateUsdValue(bestQuote);
};