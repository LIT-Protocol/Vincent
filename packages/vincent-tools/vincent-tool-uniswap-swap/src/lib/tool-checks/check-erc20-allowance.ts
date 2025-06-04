import { PublicClient } from 'viem';
import { parseAbi } from 'viem';

const ERC20_ABI = parseAbi([
  'function allowance(address owner, address spender) view returns (uint256)',
]);

export const checkErc20Allowance = async ({
  client,
  tokenAddress,
  owner,
  spender,
  tokenAmount,
}: {
  client: PublicClient;
  tokenAddress: `0x${string}`;
  owner: `0x${string}`;
  spender: `0x${string}`;
  tokenAmount: bigint;
}): Promise<bigint> => {
  const currentAllowance = await client.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [owner, spender],
  });

  if (currentAllowance < tokenAmount) {
    throw new Error(
      `Address ${owner} has insufficient ERC20 allowance for spender ${spender} for token ${tokenAddress} (checkErc20Allowance)`,
    );
  }

  return currentAllowance;
};
