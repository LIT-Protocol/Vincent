const fs = require('fs');
const path = require('path');
const { LIT_NETWORK, AUTH_METHOD_TYPE, AUTH_METHOD_SCOPE } = require('@lit-protocol/constants');
const { LitContracts } = require('@lit-protocol/contracts-sdk');
const { ethers } = require('ethers');

// Environment variables
const TEST_APP_DELEGATEE_PRIVATE_KEY = process.env.TEST_APP_DELEGATEE_PRIVATE_KEY;
if (!TEST_APP_DELEGATEE_PRIVATE_KEY) {
  throw new Error('TEST_APP_DELEGATEE_PRIVATE_KEY environment variable is not set');
}

const YELLOWSTONE_RPC_URL = process.env.YELLOWSTONE_RPC_URL;
if (!YELLOWSTONE_RPC_URL) {
  throw new Error('YELLOWSTONE_RPC_URL environment variable is not set');
}

const getPkpInfoFromMintReceipt = async (txReceipt, litContractsClient) => {
  // PKP Minted event topic
  const PKP_MINTED_TOPIC = '0x3b2cc0657d0387a736293d66389f78e4c8025e413c7a1ee67b7707d4418c46b8';

  const pkpMintedEvent = txReceipt?.events?.find(
    (event) => event.topics && event.topics[0] === PKP_MINTED_TOPIC,
  );

  if (!pkpMintedEvent) {
    throw new Error('Could not find PKP mint event in transaction receipt');
  }

  // The public key is in the event data, bytes 65 (130 hex) to 129 (260 hex)
  const publicKey = '0x' + pkpMintedEvent.data.slice(130, 260);
  const tokenId = ethers.utils.keccak256(publicKey);
  const ethAddress = await litContractsClient.pkpNftContract.read.getEthAddress(tokenId);

  return {
    tokenId: ethers.BigNumber.from(tokenId).toString(),
    publicKey,
    ethAddress,
  };
};

async function createPkpForPrepareAction() {
  console.log('🔄 Creating PKP for prepare lit action...');

  // Setup contracts client
  const provider = new ethers.providers.JsonRpcProvider(YELLOWSTONE_RPC_URL);
  const signer = new ethers.Wallet(TEST_APP_DELEGATEE_PRIVATE_KEY, provider);

  const litContracts = new LitContracts({
    signer,
    network: LIT_NETWORK.Datil,
  });
  await litContracts.connect();

  // Read the current prepare metadata to get IPFS CID
  const metadataPath = path.join(__dirname, '../src/generated/vincent-prepare-metadata.json');

  if (!fs.existsSync(metadataPath)) {
    throw new Error(
      `Prepare metadata file not found at ${metadataPath}. Please deploy the prepare lit action first.`,
    );
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const ipfsCid = metadata.ipfsCid;

  if (!ipfsCid) {
    throw new Error(
      'IPFS CID not found in prepare metadata. Please deploy the prepare lit action first.',
    );
  }
  console.log(`ℹ️  Using Prepare Lit Action with IPFS CID: ${ipfsCid}`);

  console.log('🔄 Minting new PKP...');
  const tx = await litContracts.pkpHelperContract.write.mintNextAndAddAuthMethods(
    AUTH_METHOD_TYPE.LitAction, // keyType
    [AUTH_METHOD_TYPE.LitAction], // permittedAuthMethodTypes
    [
      // This is the IPFS CID of the Lit Action which does the prepare quote generation and signing
      ethers.utils.hexlify(ethers.utils.base58.decode(ipfsCid)),
    ], // permittedAuthMethodIds
    ['0x'], // permittedAuthMethodPubkeys
    // permittedAuthMethodScopes
    [
      // Allow the custom Lit Action to sign personal messages using the PKP
      [AUTH_METHOD_SCOPE.PersonalSign],
    ],
    false, // addPkpEthAddressAsPermittedAddress
    true, // sendPkpToItself
    // mintCost
    { value: await litContracts.pkpNftContract.read.mintCost() },
  );
  const receipt = await tx.wait();
  console.log(`✅ Minted new PKP`);

  const pkpInfo = await getPkpInfoFromMintReceipt(receipt, litContracts);
  console.log(`ℹ️  PKP Public Key: ${pkpInfo.publicKey}`);
  console.log(`ℹ️  PKP Token ID: ${pkpInfo.tokenId}`);
  console.log(`ℹ️  PKP ETH Address: ${pkpInfo.ethAddress}`);

  // Update metadata file with PKP information
  const updatedMetadata = {
    ...metadata,
    pkpTokenId: pkpInfo.tokenId,
    pkpPublicKey: pkpInfo.publicKey,
    pkpEthAddress: pkpInfo.ethAddress,
  };

  fs.writeFileSync(metadataPath, JSON.stringify(updatedMetadata, null, 2));
  console.log(`ℹ️  Updated metadata file: ${metadataPath}`);
}

(async () => {
  try {
    await createPkpForPrepareAction();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating PKP:', error);
    process.exit(1);
  }
})();
