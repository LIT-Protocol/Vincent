import { ethers } from "ethers";

export const getErc20Info = async (
    userRpcProvider: ethers.providers.JsonRpcProvider,
    tokenAddress: string,
): Promise<{ decimals: ethers.BigNumber }> => {

    const contractCode = await userRpcProvider.getCode(tokenAddress);
    if (contractCode === '0x') {
        throw new Error(`No contract code found at ${tokenAddress}`);
    }

    const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function decimals() view returns (uint8)'],
        userRpcProvider
    );


    return {
        decimals: await tokenContract.decimals(),
    }
}