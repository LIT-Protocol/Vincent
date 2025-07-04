const fs = require('fs');
const path = require('path');

/**
 * Uploads a file to IPFS using Pinata
 * @param {string} filename - The name of the file
 * @param {string} fileContent - The content of the file
 * @param {string} pinataJwt - The Pinata JWT
 * @returns {Promise<string>} The IPFS hash
 */
async function uploadToIPFS(filename, fileContent, pinataJwt) {
  if (!pinataJwt) {
    throw new Error('PINATA_JWT is required');
  }

  try {
    const form = new FormData();
    form.append('file', new Blob([fileContent], { type: 'application/javascript' }), filename);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
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

/**
 * Deploys a Lit Action to IPFS
 * @param {object} options - Deployment options
 * @param {string} options.generatedDir - The directory containing the generated files
 * @param {string} options.outputFile - The name of the output file
 * @param {string} options.pinataJwt - The Pinata JWT
 * @returns {Promise<string>} The IPFS CID
 */
async function deployLitAction({ generatedDir, outputFile = 'lit-action.js', pinataJwt }) {
  try {
    const filePath = path.join(generatedDir, outputFile);
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `Bundled Lit Action code string not found at ${filePath}. Please build the tool first.`,
      );
    }
    const litActionCodeString = require(filePath);

    console.log(`Deploying ${path.dirname(path.relative(__dirname, filePath))} to IPFS...`);
    const ipfsCid = await uploadToIPFS(outputFile, litActionCodeString.code, pinataJwt);

    const cidJsonPath = path.join(generatedDir, 'vincent-tool-metadata.json');

    const metadata = fs.readFileSync(cidJsonPath);
    const { ipfsCid: metadataIpfsCid } = JSON.parse(metadata);
    if (ipfsCid !== metadataIpfsCid) {
      throw new Error(
        `IPFS CID mismatch in vincent-policy-metadata.json. Expected: ${metadataIpfsCid}, got: ${ipfsCid}`,
      );
    }

    console.log('✅ Successfully deployed Lit Action');
    console.log(`ℹ️  Deployed ${outputFile} to IPFS: ${ipfsCid}`);

    return ipfsCid;
  } catch (error) {
    console.error('❌ Error in deploy process:', error);
    throw error;
  }
}

module.exports = {
  deployLitAction,
};
