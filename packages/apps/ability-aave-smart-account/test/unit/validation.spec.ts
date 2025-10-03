import { getATokens, getAaveAddresses } from '../../src/lib/helpers/aave';
import { validateSimulation } from '../../src/lib/helpers/validation';
import type { UserOp } from '../../src/lib/helpers/userOperation';
import {
  SimulateAssetType,
  SimulateChangeType,
  type SimulateAssetChange,
  type SimulateAssetChangesError,
  type SimulateUserOperationAssetChangesResponse,
} from '../../src/lib/helpers/simulation';

const ZERO = '0x0000000000000000000000000000000000000000';
const sender = '0x09e840c213CFBd709a681590ea232479D2D063a9';
const entryPointAddress = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
const aavePoolAddress = getAaveAddresses(8453).POOL;
const aaveATokens = getATokens(8453);

const baseUserOp: UserOp = {
  sender,
  callData: '0x',
  maxFeePerGas: '0x59682F00', // 1.5 gwei (adjust to network conditions)
  maxPriorityFeePerGas: '0x3B9ACA00', // 1 gwei
  paymasterAndData: '0x',
  signature:
    '0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c',
};

const makeChange = (over: Partial<SimulateAssetChange>): SimulateAssetChange => ({
  amount: '0.000001',
  assetType: SimulateAssetType.NATIVE,
  changeType: SimulateChangeType.TRANSFER,
  contractAddress: null,
  decimals: 18,
  from: ZERO,
  logo: null,
  name: 'Token',
  rawAmount: '1',
  symbol: 'ETH',
  to: ZERO,
  tokenId: null,
  ...over,
});

const makeResponse = (
  changes: SimulateAssetChange[],
  error: SimulateAssetChangesError | null = null,
): SimulateUserOperationAssetChangesResponse => ({
  changes,
  error,
});

describe('validateSimulation', () => {
  it('passes valid native and ERC20 scenarios (based on doc example)', () => {
    const simulation = makeResponse([
      makeChange({
        assetType: SimulateAssetType.NATIVE,
        changeType: SimulateChangeType.TRANSFER,
        from: sender,
        to: entryPointAddress,
        contractAddress: null,
        symbol: 'ETH',
        name: 'Ethereum',
      }),
      makeChange({
        assetType: SimulateAssetType.ERC20,
        changeType: SimulateChangeType.TRANSFER,
        from: ZERO,
        to: sender,
        symbol: 'aBasUSDC',
      }),
      makeChange({
        assetType: SimulateAssetType.ERC20,
        changeType: SimulateChangeType.TRANSFER,
        from: sender,
        to: ZERO,
        symbol: 'aBasUSDC',
      }),
      makeChange({
        assetType: SimulateAssetType.ERC20,
        changeType: SimulateChangeType.APPROVE,
        from: sender,
        to: aavePoolAddress,
        symbol: 'USDC',
      }),
      makeChange({
        assetType: SimulateAssetType.ERC20,
        changeType: SimulateChangeType.TRANSFER,
        from: sender,
        to: aavePoolAddress,
        symbol: 'USDC',
      }),
      makeChange({
        assetType: SimulateAssetType.ERC20,
        changeType: SimulateChangeType.TRANSFER,
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
        assetType: SimulateAssetType.NATIVE,
        changeType: SimulateChangeType.TRANSFER,
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
        assetType: SimulateAssetType.ERC20,
        changeType: SimulateChangeType.APPROVE,
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
      makeChange({
        assetType: SimulateAssetType.ERC20,
        changeType: SimulateChangeType.TRANSFER,
        from: sender,
        to: random,
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
    ).toThrow(/ERC20 TRANSFER endpoints/);
  });

  it('fails for unsupported asset type', () => {
    const simulation = makeResponse([
      makeChange({
        assetType: SimulateAssetType.ERC721,
        changeType: SimulateChangeType.TRANSFER,
        from: sender,
        to: aavePoolAddress,
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
    ).toThrow(/Unsupported asset type/);
  });

  it('fails for unsupported ERC20 change type', () => {
    const simulation = makeResponse([
      makeChange({
        assetType: SimulateAssetType.ERC20,
        // @ts-expect-error this test is an invalid changeType
        changeType: 'UNKNOWN',
        from: sender,
        to: aavePoolAddress,
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
    ).toThrow(/Unsupported ERC20 change type/);
  });
});
