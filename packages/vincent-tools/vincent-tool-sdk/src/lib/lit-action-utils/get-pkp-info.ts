import { ethers } from 'ethers';

export const getPkpInfo = async (litPubkeyRouterAddress: string, yellowstoneProvider: ethers.providers.JsonRpcProvider, pkpEthAddress: string): Promise<{ tokenId: string, ethAddress: string, publicKey: string }> => {
  const PUBKEY_ROUTER_ABI = [
    'function ethAddressToPkpId(address ethAddress) public view returns (uint256)',
    'function getPubkey(uint256 tokenId) public view returns (bytes memory)',
  ];

  const pubkeyRouter = new ethers.Contract(
    litPubkeyRouterAddress,
    PUBKEY_ROUTER_ABI,
    yellowstoneProvider
  );

  const pkpTokenId = await pubkeyRouter.ethAddressToPkpId(pkpEthAddress);
  const publicKey = await pubkeyRouter.getPubkey(pkpTokenId);

  return {
    tokenId: pkpTokenId.toString(),
    ethAddress: pkpEthAddress,
    publicKey: publicKey.toString('hex'),
  };
};