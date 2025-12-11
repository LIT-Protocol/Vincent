import type {
  DecodedTransactionSuccess,
  DecodedTransactionError,
  ValidateTransactionParams,
} from '@lit-protocol/vincent-ability-sdk/gatedSigner';
import type { Address } from 'viem';

import { getAddress, isAddressEqual } from 'viem';

import { getFeeContractAddress } from './helpers/aave';
import { TransactionKind } from './helpers/transactionKind';

export const validateTransaction = (params: ValidateTransactionParams) => {
  const { chainId, decodedTransaction, sender } = params;

  if (decodedTransaction.kind === 'error') {
    const decodedTransactionError = decodedTransaction as DecodedTransactionError;
    throw new Error(`Transaction failed to decode: ${decodedTransactionError.message}`);
  }

  const decodedTransactionSuccess = decodedTransaction as DecodedTransactionSuccess;

  const feeContractAddress = getFeeContractAddress(chainId);
  if (!feeContractAddress) {
    throw new Error(`Fee contract address not found for chainId ${chainId}`);
  }

  if (decodedTransaction.kind === TransactionKind.ERC20) {
    if (['approve', 'increaseAllowance'].includes(decodedTransactionSuccess.fn)) {
      const [spender, amount] = decodedTransactionSuccess.args as [Address, bigint];
      if (!isAddressEqual(spender, feeContractAddress)) {
        throw new Error(`ERC20 approval to forbidden spender ${spender}`);
      }

      if (amount === 2n ** 256n - 1n) throw new Error('Infinite approval not allowed');
    } else {
      throw new Error('ERC20 function not allowed');
    }

    return;
  }

  if (decodedTransaction.kind === TransactionKind.FEE) {
    if (['depositToAave', 'withdrawFromAave'].includes(decodedTransactionSuccess.fn)) {
      // const [appId, assetAddress, amount] =
      //   decodedTransactionSuccess.args as [number, Address, bigint];
      // There is nothing to block here
      // A wrong appId and the delegatee will produce an invalid signature
      // A wrong assetAddress or amount and the deposit/withdrawal will fail
    } else {
      throw new Error('Fee function not allowed');
    }

    return;
  }

  if (decodedTransaction.kind === TransactionKind.AAVE) {
    const fn = decodedTransactionSuccess.fn;
    const args = decodedTransactionSuccess.args as any[]; // Args depend on the function being called

    if (fn === 'supply') {
      const onBehalfOf = getAddress(args[2]);
      if (!isAddressEqual(onBehalfOf, sender)) throw new Error('supply.onBehalfOf != sender');
    } else if (fn === 'withdraw') {
      const to = getAddress(args[2]);
      if (!isAddressEqual(to, sender)) throw new Error('withdraw.to != sender');
    } else if (fn === 'borrow') {
      const onBehalfOf = getAddress(args[4]);
      if (!isAddressEqual(onBehalfOf, sender)) throw new Error('borrow.onBehalfOf != sender');
    } else if (fn === 'repay') {
      const onBehalfOf = getAddress(args[3]);
      if (!isAddressEqual(onBehalfOf, sender)) throw new Error('repay.onBehalfOf != sender');
    } else if (fn === 'setUserUseReserveAsCollateral') {
      // ok; self-scoped setting
    } else {
      throw new Error(`Aave Pool function not allowed: ${fn}`);
    }

    return;
  }

  throw new Error('Unknown decoded transaction kind. Could not validate transaction.');
};
