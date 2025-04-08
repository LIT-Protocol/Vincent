import { ethers } from 'ethers';
import { sendErc20ApprovalTx } from '../../src/lib/lit-actions/utils/send-erc20-approval';
import { signTx } from '../../src/lib/lit-actions/utils';

// Mock ethers module
jest.mock('ethers', () => {
    const mockProvider = {
        getTransactionCount: jest.fn().mockImplementation(() => Promise.resolve(1)),
        sendTransaction: jest.fn().mockImplementation(() => Promise.resolve({ hash: '0xtxhash' })),
        getBlock: jest.fn().mockImplementation(() => Promise.resolve({ baseFeePerGas: '1000000000' })),
        getGasPrice: jest.fn().mockImplementation(() => Promise.resolve('1000000000')),
    };

    const mockContract = {
        estimateGas: {
            approve: jest.fn().mockImplementation(() => Promise.resolve('20000')),
        },
        interface: {
            encodeFunctionData: jest.fn().mockImplementation(() => '0xapprovaldata'),
        },
        provider: mockProvider,
    };

    return {
        ...jest.requireActual('ethers'),
        Contract: jest.fn().mockReturnValue(mockContract),
        providers: {
            JsonRpcProvider: jest.fn().mockReturnValue(mockProvider),
        },
    };
});

// Mock Lit.Actions interface
interface LitActions {
    runOnce: jest.Mock;
}

// Mock the global Lit object
const mockLitActions: LitActions = {
    runOnce: jest.fn(),
};

// Assign to global
const mockLit = { Actions: mockLitActions };
(global as any).Lit = mockLit;

// Mock signTx
jest.mock('../../src/lib/lit-actions/utils', () => ({
    ...jest.requireActual('../../src/lib/lit-actions/utils'),
    signTx: jest.fn(),
}));

describe('sendErc20ApprovalTx', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock Lit.Actions.runOnce for gas estimation
        mockLitActions.runOnce.mockImplementationOnce(async (_, callback) => {
            return JSON.stringify({
                data: '0xapprovaldata',
                gasLimit: '21000',
                maxFeePerGas: '1000000000',
                maxPriorityFeePerGas: '100000000',
                nonce: 1,
            });
        });

        // Mock Lit.Actions.runOnce for transaction sending
        mockLitActions.runOnce.mockImplementationOnce(async (_, callback) => {
            return '0xtxhash';
        });
    });

    it('should create and sign approval transaction with correct parameters', async () => {
        const chainId = '8453';
        const tokenInAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC
        const amountIn = '10';
        const tokenInDecimals = '6';
        const pkpEthAddress = '0x1234567890123456789012345678901234567890';
        const pkpPubKey = '0xabcdef1234567890abcdef1234567890abcdef12';

        const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');

        await sendErc20ApprovalTx(
            provider,
            chainId,
            tokenInAddress,
            amountIn,
            tokenInDecimals,
            pkpEthAddress,
            pkpPubKey
        );

        // Verify signTx was called with correct parameters
        expect(signTx).toHaveBeenCalledWith(
            pkpPubKey,
            expect.objectContaining({
                to: tokenInAddress,
                data: '0xapprovaldata',
                value: { hex: '0x0', type: 'BigNumber' },
                gasLimit: { hex: '0x5208', type: 'BigNumber' },
                maxFeePerGas: { hex: '0x3b9aca00', type: 'BigNumber' },
                maxPriorityFeePerGas: { hex: '0x5f5e100', type: 'BigNumber' },
                nonce: 1,
                chainId: 8453,
                type: 2,
            }),
            'erc20ApprovalSig'
        );

        // Verify sendTransaction was called
        expect(provider.sendTransaction).toHaveBeenCalled();
    });
});
