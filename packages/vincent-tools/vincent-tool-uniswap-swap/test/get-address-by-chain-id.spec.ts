import { getAddressesByChainId } from '../src/lib/lit-actions/utils/get-addresses-by-chain-id';

describe('getAddressesByChainId', () => {
    it('should return correct addresses for Ethereum Mainnet (chain ID 1)', () => {
        const addresses = getAddressesByChainId('1');

        expect(addresses.UNISWAP_V3_QUOTER).toBe('0x61fFE014bA17989E743c5F6cB21bF9697530B21e');
        expect(addresses.UNISWAP_V3_ROUTER).toBe('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45');
        expect(addresses.WETH_ADDRESS).toBe('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
        expect(addresses.ETH_USD_CHAINLINK_FEED).toBe('0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419');
        expect(addresses.SPENDING_LIMIT_ADDRESS).toBeNull();
    });

    it('should return correct addresses for Base Mainnet (chain ID 8453)', () => {
        const addresses = getAddressesByChainId('8453');

        expect(addresses.UNISWAP_V3_QUOTER).toBe('0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a');
        expect(addresses.UNISWAP_V3_ROUTER).toBe('0x2626664c2603336E57B271c5C0b26F421741e481');
        expect(addresses.WETH_ADDRESS).toBe('0x4200000000000000000000000000000000000006');
        expect(addresses.ETH_USD_CHAINLINK_FEED).toBeNull();
        expect(addresses.SPENDING_LIMIT_ADDRESS).toBeNull();
    });

    it('should return correct addresses for Arbitrum (chain ID 42161)', () => {
        const addresses = getAddressesByChainId('42161');

        expect(addresses.UNISWAP_V3_QUOTER).toBe('0x61fFE014bA17989E743c5F6cB21bF9697530B21e');
        expect(addresses.UNISWAP_V3_ROUTER).toBe('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45');
        expect(addresses.WETH_ADDRESS).toBe('0x82aF49447D8a07e3bd95BD0d56f35241523fBab1');
        expect(addresses.ETH_USD_CHAINLINK_FEED).toBeNull();
        expect(addresses.SPENDING_LIMIT_ADDRESS).toBeNull();
    });

    it('should return correct addresses for Yellowstone (chain ID 175188)', () => {
        const addresses = getAddressesByChainId('175188');

        expect(addresses.UNISWAP_V3_QUOTER).toBeNull();
        expect(addresses.UNISWAP_V3_ROUTER).toBeNull();
        expect(addresses.WETH_ADDRESS).toBeNull();
        expect(addresses.ETH_USD_CHAINLINK_FEED).toBeNull();
        expect(addresses.SPENDING_LIMIT_ADDRESS).toBe('0x756fA449De893446B26e10C6C66E62ccabeE908C');
    });

    it('should throw an error for unsupported chain ID', () => {
        expect(() => getAddressesByChainId('999')).toThrow('Unsupported chain ID: 999');
    });
});
