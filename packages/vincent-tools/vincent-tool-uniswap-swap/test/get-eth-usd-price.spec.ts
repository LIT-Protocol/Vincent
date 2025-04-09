import { getEthUsdPrice } from '../src/lib/lit-actions/utils/get-eth-usd-price';

// Mock Lit.Actions interface
interface LitActions {
    getRpcUrl: jest.Mock;
}

// Mock the global Lit object
const mockLitActions: LitActions = {
    getRpcUrl: jest.fn(),
};

// Assign to global
const mockLit = { Actions: mockLitActions };
(global as any).Lit = mockLit;

describe('getEthUsdPrice', () => {
    const ETH_RPC_URL = process.env.ETH_RPC_URL;

    beforeEach(() => {
        jest.clearAllMocks();
        mockLitActions.getRpcUrl.mockResolvedValue(ETH_RPC_URL);
    });

    it('should fetch the ETH/USD price from Chainlink', async () => {
        const price = await getEthUsdPrice();

        // Verify that the returned price is an ethers BigNumber
        expect(price).toBeDefined();
        expect(price._isBigNumber).toBe(true);
        expect(price.toString()).toMatch(/^[0-9]+$/);
        expect(price.gt(0)).toBe(true);

        // Verify Lit.Actions.getRpcUrl was called with ethereum chain
        expect(mockLitActions.getRpcUrl).toHaveBeenCalledWith({ chain: 'ethereum' });
    });
});
