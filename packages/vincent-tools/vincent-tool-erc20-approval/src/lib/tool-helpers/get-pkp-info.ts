import { parseAbi } from 'viem';
import { createChronicleYellowstoneViemClient } from '.';

const DATIL_PUBKEY_ROUTER_ADDRESS = '0xF182d6bEf16Ba77e69372dD096D8B70Bc3d5B475' as `0x${string}`;

export const getPkpInfo = async ({
  pkpEthAddress,
}: {
  pkpEthAddress: `0x${string}`;
}): Promise<{ tokenId: bigint; ethAddress: string; publicKey: string }> => {
  const PUBKEY_ROUTER_ABI = parseAbi([
    'function ethAddressToPkpId(address ethAddress) view returns (uint256)',
    'function getPubkey(uint256 tokenId) view returns (bytes)',
  ]);

  const chronicleYellowstoneClient = createChronicleYellowstoneViemClient();

  const pkpTokenId = await chronicleYellowstoneClient.readContract({
    address: DATIL_PUBKEY_ROUTER_ADDRESS,
    abi: PUBKEY_ROUTER_ABI,
    functionName: 'ethAddressToPkpId',
    args: [pkpEthAddress],
  });

  const publicKey = await chronicleYellowstoneClient.readContract({
    address: DATIL_PUBKEY_ROUTER_ADDRESS,
    abi: PUBKEY_ROUTER_ABI,
    functionName: 'getPubkey',
    args: [pkpTokenId],
  });

  console.log(
    `Retrieved PKP info for PKP ETH Address: ${pkpEthAddress}: tokenId: ${pkpTokenId}, publicKey: ${publicKey} (getPkpInfo)`,
  );

  return {
    tokenId: pkpTokenId,
    ethAddress: pkpEthAddress,
    publicKey: publicKey,
  };
};
