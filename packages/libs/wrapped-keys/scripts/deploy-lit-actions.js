const fs = require('fs');
const path = require('path');

// Get Pinata JWT from environment variable
const PINATA_JWT = process.env.PINATA_JWT;
if (!PINATA_JWT) {
  throw new Error('PINATA_JWT environment variable is not set in root .env file');
}

// List of lit actions to deploy with their paths relative to src/lib/lit-actions/generated
const LIT_ACTIONS = [
  {
    name: 'generateEncryptedSolanaPrivateKey',
    path: 'solana/generateEncryptedSolanaPrivateKey.js',
    metadataPath: 'solana/generateEncryptedSolanaPrivateKey-metadata.json',
  },
  {
    name: 'batchGenerateEncryptedKeys',
    path: 'common/batchGenerateEncryptedKeys.js',
    metadataPath: 'common/batchGenerateEncryptedKeys-metadata.json',
  },
];

(async () => {
  try {
    const generatedDir = path.join(__dirname, '../src/lib/lit-actions/generated');

    for (const action of LIT_ACTIONS) {
      const filePath = path.join(generatedDir, action.path);
      if (!fs.existsSync(filePath)) {
        throw new Error(
          `Bundled Lit Action code not found at ${filePath}. Please run pnpx nx run wrapped-keys:action:build first.`,
        );
      }

      const litActionModule = require(filePath);
      const litActionCodeString = litActionModule.code;

      console.log(`Deploying ${action.name} to IPFS...`);
      const ipfsCid = await uploadToIPFS(`${action.name}.js`, litActionCodeString);

      const metadataPath = path.join(generatedDir, action.metadataPath);
      const metadata = fs.readFileSync(metadataPath);
      const { ipfsCid: metadataIpfsCid } = JSON.parse(metadata);

      if (ipfsCid !== metadataIpfsCid) {
        throw new Error(
          `IPFS CID mismatch for ${action.name}. Expected: ${metadataIpfsCid}, got: ${ipfsCid}`,
        );
      }

      console.log(`✅ Successfully deployed ${action.name}`);
      console.log(`ℹ️  Deployed ${action.name} to IPFS: ${ipfsCid}`);
    }

    console.log('\n✅ All Lit Actions deployed successfully!');
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
