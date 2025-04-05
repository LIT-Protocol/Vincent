import { ethers } from "ethers";

import { getAddressesByChainId, getEthUsdPrice, getUniswapQuote } from ".";

const calculateUsdValue = async (
    amountInWeth: ethers.BigNumber,
): Promise<ethers.BigNumber> => {
    // Get ETH price in USD from Chainlink on Ethereum mainnet
    const ethUsdPrice = await getEthUsdPrice();
    console.log(`ETH price in USD (8 decimals): ${ethUsdPrice.toString()}`);

    // Calculate USD value (8 decimals precision)
    const CHAINLINK_DECIMALS = 8;
    const WETH_DECIMALS = 18; // WETH decimals
    const amountInUsd = amountInWeth.mul(ethUsdPrice).div(ethers.BigNumber.from(10).pow(WETH_DECIMALS));
    console.log(`Token amount in USD (8 decimals): $${ethers.utils.formatUnits(amountInUsd, CHAINLINK_DECIMALS)}`);

    return amountInUsd;
};

export const getTokenAmountInUsd = async (
    userRpcProvider: ethers.providers.JsonRpcProvider,
    userChainId: string,
    amountIn: string,
    tokenInAddress: string,
    tokenInDecimals: string,
): Promise<ethers.BigNumber> => {
    const { WETH_ADDRESS } = getAddressesByChainId(userChainId);

    // Special case for WETH - no need to get a quote since it's already in ETH terms
    if (tokenInAddress.toLowerCase() === WETH_ADDRESS!.toLowerCase()) {
        console.log(`Input token is WETH, using amount directly: ${amountIn}`);
        const amountInWeth = ethers.utils.parseUnits(amountIn, tokenInDecimals);
        return calculateUsdValue(amountInWeth);
    }

    console.log(`Getting ${amountIn.toString()} ${tokenInAddress} price in WETH from Uniswap...`);
    const { bestQuote } = await getUniswapQuote(
        userRpcProvider,
        userChainId,
        tokenInAddress,
        WETH_ADDRESS!,
        amountIn,
        tokenInDecimals,
        '18' // WETH decimals
    );
    const amountInWeth = bestQuote;
    console.log(`Amount in WETH: ${ethers.utils.formatUnits(amountInWeth, 18)}`);

    return calculateUsdValue(amountInWeth);
};