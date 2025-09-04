const fs = require('fs');
const path = require('path');

// Get Pinata JWT from environment variable
const PINATA_JWT = process.env.PINATA_JWT;
if (!PINATA_JWT) {
  throw new Error('PINATA_JWT environment variable is not set in root .env file');
}

async function deployLitAction(outputFile, metadataFile, description) {
  const generatedDir = path.join(__dirname, '../src/generated');
  const filePath = path.join(generatedDir, outputFile);

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Bundled ${description} code string not found at ${filePath}. Please run pnpm node ./esbuild.config.js first.`,
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

  return ipfsCid;
}

(async () => {
  try {
    // Deploy main Vincent ability lit action
    await deployLitAction(
      'lit-action.js',
      'vincent-ability-metadata.json',
      'Vincent Ability Lit Action',
    );

    // Deploy prepare lit action
    await deployLitAction(
      'lit-action-prepare.js',
      'vincent-prepare-metadata.json',
      'Prepare Lit Action',
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
