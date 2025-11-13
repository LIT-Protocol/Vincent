const fs = require('fs');
const path = require('path');
const ethers = require('ethers');
const { LitContracts } = require('@lit-protocol/contracts-sdk');
const { LIT_RPC } = require('@lit-protocol/constants');

// Get Pinata JWT from environment variable
const PINATA_JWT = process.env.PINATA_JWT;
if (!PINATA_JWT) {
  throw new Error('PINATA_JWT environment variable is not set in root .env file');
}

async function deployLitAction(outputFile, metadataFile, description) {
  const generatedDir = path.join(__dirname, '../lit-actions/generated');
  const filePath = path.join(generatedDir, outputFile);

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Bundled ${description} code string not found at ${filePath}. Please run pnpm node ./esbuild.lit-actions.config.js first.`,
    );
  }

  const litActionCodeString = require(filePath);

  console.log(`Deploying ${outputFile} to IPFS...`);
  const ipfsCid = await uploadToIPFS(outputFile, litActionCodeString.code);

  const cidJsonPath = path.join(generatedDir, metadataFile);
  const metadata = fs.readFileSync(cidJsonPath);
  const { ipfsCid: metadataIpfsCid } = JSON.parse(metadata);

  if (ipfsCid !== metadataIpfsCid) {
    throw new Error(
      `IPFS CID mismatch in ${metadataFile}. Expected: ${metadataIpfsCid}, got: ${ipfsCid}`,
    );
  }

  console.log(`✅ Successfully deployed ${description}`);
  console.log(`ℹ️  Deployed ${outputFile} to IPFS: ${ipfsCid}`);

  const { derivedAddress, derivedPubkey } = await deriveLitActionWalletAddress(ipfsCid);
  console.log(`ℹ️  Derived action wallet address: ${derivedAddress}`);
  console.log(`ℹ️  Derived action pubkey: ${derivedPubkey}`);

  return ipfsCid;
}

(async () => {
  try {
    // Deploy the owner attestation signing lit action
    await deployLitAction(
      'signOwnerAttestation.js',
      'signOwnerAttestation-metadata.json',
      'Owner Attestation Signing Lit Action',
    );

    console.log('✅ All lit actions deployed successfully');
  } catch (error) {
    console.error('❌ Error in deploy process:', error);
    process.exit(1);
  }
})();

async function uploadToIPFS(filename, fileContent) {
  try {
    const form = new FormData();
    form.append('file', new Blob([fileContent], { type: 'application/javascript' }), filename);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: form,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${text}`);
    }

    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

async function deriveLitActionWalletAddress(litActionIpfsCid) {
  // We're only using read functions so we can use any wallet, so we create a random one.
  let ethersSigner = new ethers.Wallet.createRandom();
  ethersSigner = ethersSigner.connect(
    new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE),
  );

  const contractClient = new LitContracts({ signer: ethersSigner });
  await contractClient.connect();

  const derivedKeyId = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(`lit_action_${litActionIpfsCid}`),
  );

  const derivedPubkey = await contractClient.pubkeyRouterContract.read.getDerivedPubkey(
    contractClient.stakingContract.read.address,
    derivedKeyId,
  );

  return {
    derivedPubkey,
    derivedAddress: ethers.utils.computeAddress(derivedPubkey),
  };
}
