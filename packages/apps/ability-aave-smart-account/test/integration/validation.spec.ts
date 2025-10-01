import { getATokens, getAaveAddresses } from '../../src/lib/helpers/aave';
import { validateSimulation } from '../../src/lib/helpers/validation';
import type { UserOp } from '../src/lib/helpers/userOperation';
import type {
  SimulateAssetChange,
  SimulateAssetChangesError,
  SimulateUserOperationAssetChangesResponse,
} from '../src/lib/helpers/simulation';
import { ENTRY_POINT, SMART_ACCOUNT_ADDRESS, CHAIN_ID } from '../helpers/test-variables';

const ZERO = '0x0000000000000000000000000000000000000000';

const sender = SMART_ACCOUNT_ADDRESS;
const entryPointAddress = ENTRY_POINT;
const aavePoolAddress = getAaveAddresses(CHAIN_ID).POOL;
const aaveATokens = getATokens(CHAIN_ID);

const baseUserOp: UserOp = {
  sender,
  callData: '0x',
};

const makeChange = (over: Partial<SimulateAssetChange>): SimulateAssetChange => ({
  rawAmount: '1',
  amount: '0.000001',
  contractAddress: null,
  tokenId: null,
  decimals: 18,
  name: 'Token',
  logo: null,
  ...over,
});

const makeResponse = (
  changes: SimulateAssetChange[],
  error: SimulateAssetChangesError | null = null,
): SimulateUserOperationAssetChangesResponse => ({
  changes: changes as any,
  error,
});

describe('validateSimulation', () => {
  it('passes valid native and ERC20 scenarios (based on doc example)', () => {
    const simulation = makeResponse([
      makeChange({
        assetType: 'NATIVE',
        changeType: 'TRANSFER',
        from: sender,
        to: entryPointAddress,
        contractAddress: null,
        symbol: 'ETH',
        name: 'Ethereum',
      }),
      makeChange({
        assetType: 'ERC20',
        changeType: 'TRANSFER',
        from: ZERO,
        to: sender,
        symbol: 'aBasUSDC',
      }),
      makeChange({
        assetType: 'ERC20',
        changeType: 'TRANSFER',
        from: sender,
        to: ZERO,
        symbol: 'aBasUSDC',
      }),
      makeChange({
        assetType: 'ERC20',
        changeType: 'APPROVE',
        from: sender,
        to: aavePoolAddress,
        symbol: 'USDC',
      }),
      makeChange({
        assetType: 'ERC20',
        changeType: 'TRANSFER',
        from: sender,
        to: aavePoolAddress,
        symbol: 'USDC',
      }),
      makeChange({
        assetType: 'ERC20',
        changeType: 'TRANSFER',
        from: aavePoolAddress,
        to: sender,
        symbol: 'USDC',
      }),
    ]);

    expect(
      validateSimulation({
        aaveATokens,
        aavePoolAddress,
        entryPointAddress,
        simulation,
        userOp: baseUserOp,
      }),
    ).toBe(true);
  });

  it('fails when simulation.error is present', () => {
    const simulation = makeResponse([], { message: 'revert' });
    expect(() =>
      validateSimulation({
        aaveATokens,
        aavePoolAddress,
        entryPointAddress,
        simulation,
        userOp: baseUserOp,
      }),
    ).toThrow(/Simulation failed/);
  });

  it('fails when native transfer is not to entry point', () => {
    const simulation = makeResponse([
      makeChange({
        assetType: 'NATIVE',
        changeType: 'TRANSFER',
        from: sender,
        to: aavePoolAddress,
        contractAddress: null,
        symbol: 'ETH',
      }),
    ]);

    expect(() =>
      validateSimulation({
        aaveATokens,
        aavePoolAddress,
        entryPointAddress,
        simulation,
        userOp: baseUserOp,
      }),
    ).toThrow(/Native transfer must be from userOp.sender to entryPointAddress/);
  });

  it('fails when approve is not to aave pool', () => {
    const simulation = makeResponse([
      makeChange({
        assetType: 'ERC20',
        changeType: 'APPROVE',
        from: sender,
        to: entryPointAddress,
      }),
    ]);

    expect(() =>
      validateSimulation({
        aaveATokens,
        aavePoolAddress,
        entryPointAddress,
        simulation,
        userOp: baseUserOp,
      }),
    ).toThrow(/APPROVE/);
  });

  it('fails when ERC20 transfer involves address outside allowed set', () => {
    const random = '0x1111111111111111111111111111111111111111';
    const simulation = makeResponse([
      makeChange({ assetType: 'ERC20', changeType: 'TRANSFER', from: sender, to: random }),
    ]);

    expect(() =>
      validateSimulation({
        aaveATokens,
        aavePoolAddress,
        entryPointAddress,
        simulation,
        userOp: baseUserOp,
      }),
    ).toThrow(/ERC20 TRANSFER endpoints/);
  });

  it('fails for unsupported asset type', () => {
    const simulation = makeResponse([
      makeChange({
        assetType: 'ERC721',
        changeType: 'TRANSFER' as any,
        from: sender,
        to: aavePoolAddress,
      }),
    ] as any);

    expect(() =>
      validateSimulation({
        aaveATokens,
        aavePoolAddress,
        entryPointAddress,
        simulation,
        userOp: baseUserOp,
      }),
    ).toThrow(/Unsupported asset type/);
  });

  it('fails for unsupported ERC20 change type', () => {
    const simulation = makeResponse([
      makeChange({
        assetType: 'ERC20',
        changeType: 'UNKNOWN',
        from: sender,
        to: aavePoolAddress,
      }),
    ] as any);

    expect(() =>
      validateSimulation({
        aaveATokens,
        aavePoolAddress,
        entryPointAddress,
        simulation,
        userOp: baseUserOp,
      }),
    ).toThrow(/Unsupported ERC20 change type/);
  });
});
