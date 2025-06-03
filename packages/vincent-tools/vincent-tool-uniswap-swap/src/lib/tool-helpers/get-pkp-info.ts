import { parseAbi } from 'viem';
import { createChronicleYellowstoneViemClient } from './viem-chronicle-yellowstone-client';

declare const Lit: {
  Actions: {
    runOnce: (
      params: {
        waitForResponse: boolean;
        name: string;
      },
      callback: () => Promise<unknown>,
    ) => Promise<unknown>;
  };
};

const DATIL_PUBKEY_ROUTER_ADDRESS = '0xF182d6bEf16Ba77e69372dD096D8B70Bc3d5B475' as `0x${string}`;

export const getPkpInfo = async ({
  pkpEthAddress,
}: {
  pkpEthAddress: `0x${string}`;
}): Promise<{ tokenId: bigint; ethAddress: string; publicKey: string }> => {
  const pkpInfoResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'getPkpInfo' },
    async () => {
      try {
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

        return JSON.stringify({
          status: 'success',
          tokenId: pkpTokenId.toString(),
          ethAddress: pkpEthAddress,
          publicKey: publicKey,
        });
      } catch (error) {
        return JSON.stringify({
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  const parsedPkpInfoResponse = JSON.parse(pkpInfoResponse as string);
  if (parsedPkpInfoResponse.status === 'error') {
    throw new Error(`Error getting PKP info: ${parsedPkpInfoResponse.error} (getPkpInfo)`);
  }

  return {
    tokenId: BigInt(parsedPkpInfoResponse.tokenId),
    ethAddress: parsedPkpInfoResponse.ethAddress,
    publicKey: parsedPkpInfoResponse.publicKey,
  };
};
