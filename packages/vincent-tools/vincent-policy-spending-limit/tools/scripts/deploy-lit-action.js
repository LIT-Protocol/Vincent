const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

const dotenvx = require('@dotenvx/dotenvx');

// Load environment variables
dotenvx.config({ path: path.join(__dirname, '../../../../../.env') });

// Get Pinata JWT from environment variable
const PINATA_JWT = process.env.PINATA_JWT;
if (!PINATA_JWT) {
  throw new Error('PINATA_JWT environment variable is not set in root .env file');
}

(async () => {
  try {
    const outputFile = 'vincent-policy-wrapped.js';

    const distDir = path.join(__dirname, '../../dist');
    const filePath = path.join(distDir, `src/generated/${outputFile}`);
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `Bundled Lit Action code string not found at ${filePath}. Please run pnpx nx run vincent-policy-spending-limit:build first.`,
      );
    }
    const litActionCodeString = require(filePath);

    console.log(`Deploying ${outputFile} to IPFS...`);
    const ipfsCid = await uploadToIPFS(outputFile, litActionCodeString.code);

    const generatedDir = path.join(__dirname, '../../src/generated');
    const cidJsPath = path.join(generatedDir, 'vincent-policy-ipfs-cid.js');
    const cidJsContent = `const vincentPolicyIpfsCid = '${ipfsCid}';\n\nmodule.exports = {\n  vincentPolicyIpfsCid,\n};\n`;
    fs.writeFileSync(cidJsPath, cidJsContent, 'utf8');

    console.log('✅ Successfully deployed Lit Action');
    console.log(`ℹ️  Deployed ${outputFile} to IPFS: ${ipfsCid}`);
    console.log(`ℹ️  Saved vincent-policy-ipfs-cid.js to: ${cidJsPath}`);
  } catch (error) {
    console.error('❌ Error in deploy process:', error);
    process.exit(1);
  }
})();

async function uploadToIPFS(filename, fileContent) {
  try {
    const form = new FormData();
    form.append('file', fileContent, {
      filename,
      contentType: 'application/javascript',
    });

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
