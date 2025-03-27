export const getAddressesByChainId = (chainId: string) => {
    let UNISWAP_V3_QUOTER: string | null = null;
    let UNISWAP_V3_ROUTER: string | null = null;
    let WETH_ADDRESS: string | null = null;
    let ETH_USD_CHAINLINK_FEED: string | null = null;
    let SPENDING_LIMIT_ADDRESS: string | null = null;

    switch (chainId) {
        case '1': // Ethereum Mainnet
            UNISWAP_V3_QUOTER = '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a';
            UNISWAP_V3_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481';
            WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
            ETH_USD_CHAINLINK_FEED = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419';
            break;
        case '8453': // Base Mainnet
            UNISWAP_V3_QUOTER = '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a';
            UNISWAP_V3_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481';
            WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
            break;
        case '42161': // Arbitrum
            UNISWAP_V3_QUOTER = '0x61fFE014bA17989E743c5F6cB21bF9697530B21e';
            UNISWAP_V3_ROUTER = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';
            WETH_ADDRESS = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1';
            break;
        case '175188': // Yellowstone
            SPENDING_LIMIT_ADDRESS = '0x2d043f8c6b80ea6396a51dc6333027fbdb8343a3';
            break;
        default:
            throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    return {
        UNISWAP_V3_QUOTER,
        UNISWAP_V3_ROUTER,
        WETH_ADDRESS,
        ETH_USD_CHAINLINK_FEED,
        SPENDING_LIMIT_ADDRESS,
    };
};