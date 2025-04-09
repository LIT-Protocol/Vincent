import { VincentToolError } from "@lit-protocol/vincent-tool";

export interface AddressesByChainIdResponse {
    UNISWAP_V3_QUOTER: string | null;
    UNISWAP_V3_ROUTER: string | null;
    WETH_ADDRESS: string | null;
    ETH_USD_CHAINLINK_FEED: string | null;
    SPENDING_LIMIT_ADDRESS: string | null;
}

export const getAddressesByChainId = (chainId: string): AddressesByChainIdResponse | VincentToolError => {
    let UNISWAP_V3_QUOTER: string | null = null;
    let UNISWAP_V3_ROUTER: string | null = null;
    let WETH_ADDRESS: string | null = null;
    let ETH_USD_CHAINLINK_FEED: string | null = null;
    let SPENDING_LIMIT_ADDRESS: string | null = null;

    switch (chainId) {
        case '1': // Ethereum Mainnet
            /**
             * Source: https://docs.chain.link/data-feeds/price-feeds/addresses/?network=ethereum&page=1&search=ETH%2FUSD
             */
            ETH_USD_CHAINLINK_FEED = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419';
            break;
        case '8453': // Base Mainnet
            UNISWAP_V3_QUOTER = '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a';
            UNISWAP_V3_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481';
            WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
            break;
        case '175188': // Yellowstone
            SPENDING_LIMIT_ADDRESS = '0x756fA449De893446B26e10C6C66E62ccabeE908C';
            break;
        default:
            return {
                status: 'error',
                details: [
                    `Unsupported chain ID: ${chainId}`
                ]
            };
    }

    return {
        UNISWAP_V3_QUOTER,
        UNISWAP_V3_ROUTER,
        WETH_ADDRESS,
        ETH_USD_CHAINLINK_FEED,
        SPENDING_LIMIT_ADDRESS,
    };
};