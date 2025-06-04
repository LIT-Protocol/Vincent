import { ethers } from 'ethers';

const DATIL_PUBKEY_ROUTER_ADDRESS = '0xF182d6bEf16Ba77e69372dD096D8B70Bc3d5B475';
const PUBKEY_ROUTER_ABI = [
  'function ethAddressToPkpId(address ethAddress) public view returns (uint256)',
  'function getPubkey(uint256 tokenId) public view returns (bytes memory)',
];

export const getPkpInfo = async (
  pkpEthAddress: string,
): Promise<{ tokenId: string; ethAddress: string; publicKey: string }> => {
  console.log(
    `Getting PKP info for PKP ETH address: ${pkpEthAddress} from Datil Pubkey Router: ${DATIL_PUBKEY_ROUTER_ADDRESS} (getPkpInfo)`,
  );

  const pubkeyRouter = new ethers.Contract(
    DATIL_PUBKEY_ROUTER_ADDRESS,
    PUBKEY_ROUTER_ABI,
    new ethers.providers.StaticJsonRpcProvider('https://yellowstone-rpc.litprotocol.com/'),
  );

  const pkpTokenId = await pubkeyRouter.ethAddressToPkpId(pkpEthAddress);
  const publicKey = await pubkeyRouter.getPubkey(pkpTokenId);

  return {
    tokenId: pkpTokenId.toString(),
    ethAddress: pkpEthAddress,
    publicKey: publicKey.toString('hex'),
  };
};
