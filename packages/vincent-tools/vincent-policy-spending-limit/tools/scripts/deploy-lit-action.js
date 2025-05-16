const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');
const dotenvx = require('@dotenvx/dotenvx');

// Load environment variables
dotenvx.config({ path: path.join(__dirname, '../../../../../.env') });

(async () => {
  try {
    const distDir = path.join(__dirname, '../../dist');
    const outputFile = 'deployed-lit-action-vincent-policy.js';
    const filePath = path.join(distDir, outputFile);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Built action not found at ${filePath}. Please run build:action first.`);
    }

    console.log(`Deploying ${outputFile} to IPFS...`);
    const ipfsCid = await uploadToIPFS(filePath);

    // Write deployment results to a JSON file
    const deployConfig = {
      vincentPolicyIpfsCid: ipfsCid,
    };

    const ipfsOutputFileName = 'vincent-policy-ipfs.json';
    const ipfsJsonPath = path.join(distDir, ipfsOutputFileName);
    fs.writeFileSync(ipfsJsonPath, JSON.stringify(deployConfig, null, 2), 'utf8');

    console.log('✅ Successfully deployed Lit Action');
    console.log(`ℹ️  Deployed ${outputFile} to IPFS: ${ipfsCid}`);
    console.log(`ℹ️  Saved ${ipfsOutputFileName} to: ${ipfsJsonPath}`);
  } catch (error) {
    console.error('❌ Error in deploy process:', error);
    process.exit(1);
  }
})();

async function uploadToIPFS(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath);
    const form = new FormData();
    form.append('file', fileContent, {
      filename: path.basename(filePath),
      contentType: 'application/javascript',
    });

    // Get Pinata JWT from environment variable
    const PINATA_JWT = process.env.PINATA_JWT;
    if (!PINATA_JWT) {
      throw new Error('PINATA_JWT environment variable is not set');
    }

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
