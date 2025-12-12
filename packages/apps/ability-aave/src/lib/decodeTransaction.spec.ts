import { DecodeTransactionParams } from '@lit-protocol/vincent-ability-sdk/gatedSigner';
import { Address, encodeFunctionData } from 'viem';

import { decodeTransaction } from './decodeTransaction';
import {
  getAaveApprovalTx,
  getAaveSupplyTx,
  getAaveWithdrawTx,
  getAaveBorrowTx,
  getAaveRepayTx,
} from './helpers/aave';
import { ERC20_ABI } from './helpers/erc20';
import { TransactionKind } from './helpers/transactionKind';

const CHAIN_ID = 137; // Polygon
const TEST_ACCOUNT: Address = '0x1234567890123456789012345678901234567890';
const TEST_ASSET: Address = '0x0000000000000000000000000000000000000001';
const TEST_SPENDER: Address = '0x0000000000000000000000000000000000000002';

describe('decodeTransaction', () => {
  it('should decode Aave Supply transaction', async () => {
    const tx = getAaveSupplyTx({
      accountAddress: TEST_ACCOUNT,
      appId: 123,
      assetAddress: TEST_ASSET,
      chainId: CHAIN_ID,
      amount: '100',
    });

    const params: DecodeTransactionParams = {
      transaction: {
        to: tx.to,
        value: BigInt(tx.value),
        data: tx.data,
      },
    };

    const decoded = decodeTransaction(params);

    expect(decoded.kind).toBe(TransactionKind.FEE);
    if (decoded.kind === TransactionKind.FEE) {
      expect(decoded.fn).toBe('depositToAave');
      expect(decoded.args).toBeDefined();
      const [appId, assetAddress, amount] = decoded.args as [number, Address, bigint];
      expect(appId).toBe(123);
      expect(assetAddress.toLowerCase()).toBe(TEST_ASSET.toLowerCase());
      expect(amount).toBe(BigInt(100));
    }
  });

  it('should decode Aave Withdraw transaction', async () => {
    const tx = getAaveWithdrawTx({
      accountAddress: TEST_ACCOUNT,
      appId: 123,
      assetAddress: TEST_ASSET,
      chainId: CHAIN_ID,
      amount: '100',
    });

    const params: DecodeTransactionParams = {
      transaction: {
        data: tx.data,
        to: tx.to,
        value: BigInt(tx.value),
      },
    };

    const decoded = decodeTransaction(params);

    expect(decoded.kind).toBe(TransactionKind.FEE);
    if (decoded.kind === TransactionKind.FEE) {
      expect(decoded.fn).toBe('withdrawFromAave');
      expect(decoded.args).toBeDefined();
      const [appId, assetAddress, amount] = decoded.args as [number, Address, bigint];
      expect(appId).toBe(123);
      expect(assetAddress.toLowerCase()).toBe(TEST_ASSET.toLowerCase());
      expect(amount).toBe(BigInt(100));
    }
  });

  it('should decode Aave Borrow transaction', async () => {
    const tx = getAaveBorrowTx({
      accountAddress: TEST_ACCOUNT,
      amount: '100',
      assetAddress: TEST_ASSET,
      chainId: CHAIN_ID,
      interestRateMode: 1,
    });

    const params: DecodeTransactionParams = {
      transaction: {
        data: tx.data,
        to: tx.to,
        value: BigInt(tx.value),
      },
    };

    const decoded = decodeTransaction(params);

    expect(decoded.kind).toBe(TransactionKind.AAVE);
    if (decoded.kind === TransactionKind.AAVE) {
      expect(decoded.fn).toBe('borrow');
      expect(decoded.args).toBeDefined();
      expect((decoded.args?.[0] as Address).toLowerCase()).toBe(TEST_ASSET.toLowerCase());
    }
  });

  it('should decode Aave Repay transaction', async () => {
    const tx = getAaveRepayTx({
      accountAddress: TEST_ACCOUNT,
      amount: '100',
      assetAddress: TEST_ASSET,
      chainId: CHAIN_ID,
      interestRateMode: 1,
    });

    const params: DecodeTransactionParams = {
      transaction: {
        data: tx.data,
        to: tx.to,
        value: BigInt(tx.value),
      },
    };

    const decoded = decodeTransaction(params);

    expect(decoded.kind).toBe(TransactionKind.AAVE);
    if (decoded.kind === TransactionKind.AAVE) {
      expect(decoded.fn).toBe('repay');
      expect(decoded.args).toBeDefined();
      expect((decoded.args?.[0] as Address).toLowerCase()).toBe(TEST_ASSET.toLowerCase());
    }
  });

  it('should decode ERC20 Approve transaction', async () => {
    const tx = getAaveApprovalTx({
      accountAddress: TEST_ACCOUNT,
      assetAddress: TEST_ASSET,
      chainId: CHAIN_ID,
      amount: '100',
    });

    const params: DecodeTransactionParams = {
      transaction: {
        data: tx.data,
        to: tx.to, // Should be asset address
        value: BigInt(tx.value),
      },
    };

    const decoded = decodeTransaction(params);

    expect(decoded.kind).toBe(TransactionKind.ERC20);
    if (decoded.kind === TransactionKind.ERC20) {
      expect(decoded.fn).toBe('approve');
      expect(decoded.args).toBeDefined();
    }
  });

  it('should decode ERC20 increaseAllowance transaction', async () => {
    const amount = 100n;
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'increaseAllowance',
      args: [TEST_SPENDER, amount],
    });

    const params: DecodeTransactionParams = {
      transaction: {
        data: data,
        to: TEST_ASSET,
        value: BigInt('0x0'),
      },
    };

    const decoded = decodeTransaction(params);

    expect(decoded.kind).toBe(TransactionKind.ERC20);
    if (decoded.kind === TransactionKind.ERC20) {
      expect(decoded.fn).toBe('increaseAllowance');
      expect(decoded.args).toBeDefined();
      expect((decoded.args?.[0] as Address).toLowerCase()).toBe(TEST_SPENDER.toLowerCase());
      expect(decoded.args?.[1]).toBe(amount);
    }
  });

  it('should return error for unknown transaction', () => {
    const params: DecodeTransactionParams = {
      transaction: {
        data: '0x12345678', // Random data
        to: TEST_ASSET,
        value: BigInt('0x0'),
      },
    };

    const decoded = decodeTransaction(params);
    expect(decoded.kind).toBe('error');
  });
});
