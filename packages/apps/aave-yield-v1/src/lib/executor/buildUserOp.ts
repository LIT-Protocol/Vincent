import type { Address, Chain, PublicClient } from 'viem';

import {
  getAaveApprovalTx,
  getAaveSupplyTx,
  getFeeContractAddress,
  toVincentUserOp,
} from '@lit-protocol/vincent-ability-aave';
import { transactionsToZerodevUserOp } from '@lit-protocol/vincent-ability-relay-link';

import { ERC20_ABI } from '../utils/erc20';

export async function buildUserOp(params: {
  baseClient: PublicClient;
  agentAddress: Address;
  asset: Address;
  amount: bigint;
  appId: number;
  chain: Chain;
  zerodevRpcUrl: string;
  serializedPermissionAccount: string;
}) {
  const {
    baseClient,
    agentAddress,
    asset,
    amount,
    appId,
    chain,
    zerodevRpcUrl,
    serializedPermissionAccount,
  } = params;

  const feeDiamond = getFeeContractAddress(chain.id);
  if (!feeDiamond) {
    throw new Error(`Fee Diamond not configured for chain ${chain.id}`);
  }

  const allowance = (await baseClient.readContract({
    address: asset,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [agentAddress, feeDiamond],
  })) as bigint;

  const txs = [] as Array<{ to: Address; data: `0x${string}`; value: `0x${string}` }>;

  if (allowance < amount) {
    txs.push(
      getAaveApprovalTx({
        accountAddress: agentAddress,
        assetAddress: asset,
        amount: amount.toString(),
        chainId: chain.id,
      }),
    );
  }

  txs.push(
    getAaveSupplyTx({
      appId,
      accountAddress: agentAddress,
      assetAddress: asset,
      amount: amount.toString(),
      chainId: chain.id,
    }),
  );

  const userOp = await transactionsToZerodevUserOp({
    permittedAddress: agentAddress,
    serializedPermissionAccount,
    transactions: txs.map((tx) => ({
      to: tx.to,
      data: tx.data,
      value: BigInt(tx.value).toString(),
    })),
    chain,
    zerodevRpcUrl,
  });

  return toVincentUserOp(userOp as any);
}
