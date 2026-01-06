import type { Address } from 'viem';

import { createPublicClient, getAddress, http } from 'viem';

import type { LifecycleFunctionSteps } from './lifecycleFunctions';
import type { Transaction } from './transaction';
import type { UserOp } from './userOperation';

import { getUserOpCalls } from './lowLevelCall';
import { simulateTransaction, simulateUserOp } from './simulation';

interface AssertIsValidUserOpParams extends LifecycleFunctionSteps {
  alchemyRpcUrl: string;
  entryPointAddress: Address;
  userOp: UserOp;
}

export const assertIsValidUserOp = async ({
  alchemyRpcUrl,
  decodeTransaction,
  entryPointAddress,
  userOp,
  validateSimulation,
  validateTransaction,
}: AssertIsValidUserOpParams) => {
  const publicClient = createPublicClient({
    transport: http(alchemyRpcUrl),
  });
  const chainId = await publicClient.getChainId();
  const sender = getAddress(userOp.sender, chainId);

  const userOpTransactions = getUserOpCalls(userOp);
  for (const transaction of userOpTransactions) {
    const decodedTransaction = decodeTransaction({
      transaction: {
        data: transaction.data,
        to: transaction.to,
        value: BigInt(transaction.value),
      },
    });
    await validateTransaction({
      chainId,
      decodedTransaction,
      sender,
    });
  }

  // Simulate userOp and validate changes
  const simulation = await simulateUserOp({
    entryPointAddress,
    publicClient,
    userOp,
  });
  if (simulation.error) {
    const { message, revertReason } = simulation.error;
    throw new Error(`Simulation failed - Reason: ${revertReason} - Message: ${message}`);
  }

  await validateSimulation({
    chainId,
    sender,
    simulation,
  });

  return simulation.changes;
};

interface AssertIsValidTransactionParams extends LifecycleFunctionSteps {
  alchemyRpcUrl: string;
  transaction: Transaction;
}

export async function assertIsValidTransaction({
  alchemyRpcUrl,
  decodeTransaction,
  transaction,
  validateSimulation,
  validateTransaction,
}: AssertIsValidTransactionParams) {
  const publicClient = createPublicClient({
    transport: http(alchemyRpcUrl),
  });
  const chainId = await publicClient.getChainId();
  const sender = getAddress(transaction.from);

  const decodedTransaction = decodeTransaction({
    transaction: {
      data: transaction.data,
      to: transaction.to,
      value: BigInt(transaction.value),
    },
  });
  await validateTransaction({
    chainId,
    decodedTransaction,
    sender,
  });

  const simulation = await simulateTransaction({
    publicClient,
    transaction,
  });
  const { changes, error } = simulation;
  if (error) {
    const { message, revertReason } = error;
    throw new Error(`Simulation failed - Reason: ${revertReason} - Message: ${message}`);
  }

  await validateSimulation({
    chainId,
    sender,
    simulation,
  });

  return changes;
}
