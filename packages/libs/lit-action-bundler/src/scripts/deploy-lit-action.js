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
async function deployLitAction({ generatedDir, outputFile = 'lit-action.js', pinataJwt, type }) {
  try {
    if (type !== 'tool' && type !== 'policy') {
      throw new Error(`Invalid type: ${type}. Must be 'tool' or 'policy'.`);
    }

    const filePath = path.join(generatedDir, outputFile);
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `Bundled Lit Action code string not found at ${filePath}. Please build the tool first.`,
      );
    }
    const litActionCodeString = require(filePath);

    const ipfsCid = await uploadToIPFS(outputFile, litActionCodeString.code, pinataJwt);

    const cidJsonPath = path.join(generatedDir, `vincent-${type}-metadata.json`);

    const metadata = fs.readFileSync(cidJsonPath);
    const { ipfsCid: metadataIpfsCid } = JSON.parse(metadata);
    if (ipfsCid !== metadataIpfsCid) {
      throw new Error(
        `IPFS CID mismatch in vincent-${type}-metadata.json. Expected: ${metadataIpfsCid}, got: ${ipfsCid}`,
      );
    }

    const filePathArr = generatedDir.split('/');
    console.log(
      `✅ ${type === 'tool' ? '🛠️' : '⚖️'}${filePathArr.slice(filePathArr.length - 2, filePathArr.length - 1)} Deployed to IPFS`,
    );

    return ipfsCid;
  } catch (error) {
    console.error(
      "❌ ${type === 'tool' ? '🛠️' : '⚖️'}${filePathArr.slice(filePathArr.length - 2, filePathArr.length - 1)} Error deploying to IPFS:",
      error.message,
    );
    throw error;
  }
}

module.exports = {
  deployLitAction,
};
