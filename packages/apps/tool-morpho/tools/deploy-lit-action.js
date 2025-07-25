const fs = require('fs');
const path = require('path');

// Get Pinata JWT from environment variable
const PINATA_JWT = process.env.PINATA_JWT;
if (!PINATA_JWT) {
  throw new Error('PINATA_JWT environment variable is not set in root .env file');
}

(async () => {
  try {
    const outputFile = 'lit-action.js';

    const generatedDir = path.join(__dirname, '../src/generated');
    const filePath = path.join(generatedDir, outputFile);
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `Bundled Lit Action code string not found at ${filePath}. Please run pnpx nx run vincent-tool-morpho:action:build first.`,
      );
    }
    const litActionCodeString = require(filePath);

    console.log(`Deploying ${outputFile} to IPFS...`);
    const ipfsCid = await uploadToIPFS(outputFile, litActionCodeString.code);

    const cidJsonPath = path.join(generatedDir, 'vincent-tool-metadata.json');

    const metadata = fs.readFileSync(cidJsonPath);
    const { ipfsCid: metadataIpfsCid } = JSON.parse(metadata);
    if (ipfsCid !== metadataIpfsCid) {
      throw new Error(
        `IPFS CID mismatch in vincent-policy-metadata.json. Expected: ${metadataIpfsCid}, got: ${ipfsCid}`,
      );
    }

    // const cidJsonContent = {
    //   ipfsCid,
    // };
    // fs.writeFileSync(cidJsonPath, JSON.stringify(cidJsonContent, null, 2), 'utf8');

    console.log('✅ Successfully deployed Lit Action');
    console.log(`ℹ️  Deployed ${outputFile} to IPFS: ${ipfsCid}`);
    // console.log(`ℹ️  Saved vincent-tool-metadata.json to: ${cidJsonPath}`);
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
