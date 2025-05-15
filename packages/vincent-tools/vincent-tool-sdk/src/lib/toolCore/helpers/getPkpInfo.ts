// src/lib/toolCore/helpers/getPkpInfo.ts

import { ethers } from 'ethers';

export const getPkpInfo = async ({
  litPubkeyRouterAddress,
  yellowstoneRpcUrl,
  pkpEthAddress,
}: {
  litPubkeyRouterAddress: string;
  yellowstoneRpcUrl: string;
  pkpEthAddress: string;
}): Promise<{ tokenId: string; ethAddress: string; publicKey: string }> => {
  try {
    const PUBKEY_ROUTER_ABI = [
      'function ethAddressToPkpId(address ethAddress) public view returns (uint256)',
      'function getPubkey(uint256 tokenId) public view returns (bytes memory)',
    ];

    const pubkeyRouter = new ethers.Contract(
      litPubkeyRouterAddress,
      PUBKEY_ROUTER_ABI,
      new ethers.providers.StaticJsonRpcProvider(yellowstoneRpcUrl),
    );

    const pkpTokenId = await pubkeyRouter.ethAddressToPkpId(pkpEthAddress);
    const publicKey = await pubkeyRouter.getPubkey(pkpTokenId);

    return {
      tokenId: pkpTokenId.toString(),
      ethAddress: pkpEthAddress,
      publicKey: publicKey.toString('hex'),
    };
  } catch (error) {
    throw new Error(
      `Error getting PKP info for PKP Eth Address: ${pkpEthAddress} using Lit Pubkey Router: ${litPubkeyRouterAddress} and Yellowstone RPC URL: ${yellowstoneRpcUrl}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
