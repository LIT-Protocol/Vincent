import { PublicClient } from 'viem';
import { parseAbi } from 'viem';

const ERC20_ABI = parseAbi([
  'function allowance(address owner, address spender) view returns (uint256)',
]);

export const getCurrentAllowance = async ({
  client,
  tokenAddress,
  owner,
  spender,
}: {
  client: PublicClient;
  tokenAddress: `0x${string}`;
  owner: `0x${string}`;
  spender: `0x${string}`;
}): Promise<bigint> => {
  return client.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [owner, spender],
  });
};
