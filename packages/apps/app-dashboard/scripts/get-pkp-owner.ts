import { ethers } from 'ethers';

const YELLOWSTONE_RPC_URL = 'https://yellowstone-rpc.litprotocol.com/';
const DATIL_PUBKEY_ROUTER_ADDRESS = '0xF182d6bEf16Ba77e69372dD096D8B70Bc3d5B475';
const DATIL_PKP_NFT_ADDRESS = '0x487A9D096BB4B7Ac1520Cb12370e31e677B175EA';

const PUBKEY_ROUTER_ABI = [
  'function ethAddressToPkpId(address ethAddress) public view returns (uint256)',
];

const PKP_NFT_ABI = ['function ownerOf(uint256 tokenId) public view returns (address)'];

async function getPkpOwner(pkpEthAddress: string): Promise<string> {
  const provider = new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL);

  // Checksum the address
  const checksummedAddress = ethers.utils.getAddress(pkpEthAddress);
  console.log(`Checksummed address: ${checksummedAddress}`);

  // Get the token ID from the PKP eth address
  const pubkeyRouter = new ethers.Contract(
    DATIL_PUBKEY_ROUTER_ADDRESS,
    PUBKEY_ROUTER_ABI,
    provider,
  );
  const tokenId = await pubkeyRouter.ethAddressToPkpId(checksummedAddress);
  console.log(`Token ID: ${tokenId.toString()}`);

  if (tokenId.isZero()) {
    throw new Error(`No PKP found for address: ${checksummedAddress}`);
  }

  // Get the owner from the PKP NFT contract
  const pkpNft = new ethers.Contract(DATIL_PKP_NFT_ADDRESS, PKP_NFT_ABI, provider);
  const owner = await pkpNft.ownerOf(tokenId);

  return owner;
}

// PKP address to look up
const PKP_ADDRESS = '0xa23fd4b36a59466912b0ff8cae6a1802525d60aa';

getPkpOwner(PKP_ADDRESS)
  .then((owner) => {
    console.log(`PKP Address: ${PKP_ADDRESS}`);
    console.log(`Owner Address: ${owner}`);
  })
  .catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
