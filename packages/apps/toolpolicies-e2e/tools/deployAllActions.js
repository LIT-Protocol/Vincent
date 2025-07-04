const fs = require('fs');
const path = require('path');
const { deployLitAction } = require('./deploy-lit-action');

// Base directory for generated tools
const GENERATED_DIR = path.resolve(__dirname, '../src/generated');

/**
 * Gets all tool directories in the generated directory
 * @returns {string[]} Array of tool directory paths
 */
function getToolDirectories() {
  return fs
    .readdirSync(GENERATED_DIR)
    .filter((item) => {
      const itemPath = path.join(GENERATED_DIR, item);
      return (
        fs.statSync(itemPath).isDirectory() &&
        fs.existsSync(path.join(itemPath, 'lit-action.js')) &&
        fs.existsSync(path.join(itemPath, 'vincent-tool-metadata.json'))
      );
    })
    .map((item) => path.join(GENERATED_DIR, item));
}

/**
 * Deploys all tools in the generated directory
 * @param {string} pinataJwt - The Pinata JWT for IPFS uploads
 */
async function deployAllTools(pinataJwt) {
  if (!pinataJwt) {
    console.error('Error: PINATA_JWT environment variable is required');
    process.exit(1);
  }

  // Get all tool directories
  const toolDirs = getToolDirectories();

  if (toolDirs.length === 0) {
    console.log('No tools found in the generated directory. Please run buildActions.js first.');
    process.exit(0);
  }

  console.log(`Found ${toolDirs.length} tools to deploy`);

  // Deploy all tools in parallel
  console.log(`Deploying ${toolDirs.length} tools in parallel...`);

  const deployPromises = toolDirs.map(async (toolDir) => {
    const toolName = path.basename(toolDir);

    try {
      console.log(`Starting deployment of tool: ${toolName}`);
      const ipfsCid = await deployLitAction({
        generatedDir: toolDir,
        outputFile: 'lit-action.js',
        pinataJwt,
      });

      console.log(`Successfully deployed tool: ${toolName}`);
      return { toolName, ipfsCid, success: true };
    } catch (error) {
      console.error(`Error deploying tool ${toolName}:`, error);
      return { toolName, error: error.message, success: false };
    }
  });

  // Wait for all deployments to complete
  const results = await Promise.all(deployPromises);

  // Print summary
  console.log('\nDeployment Summary:');
  console.log('===================');

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.length - successCount;

  console.log(`Total: ${results.length}, Success: ${successCount}, Failed: ${failCount}`);

  if (failCount > 0) {
    console.log('\nFailed deployments:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`- ${r.toolName}: ${r.error}`);
      });
    process.exit(1);
  }
}

// Main execution
(async () => {
  try {
    // Get Pinata JWT from environment variable
    const pinataJwt = process.env.PINATA_JWT;
    await deployAllTools(pinataJwt);
  } catch (error) {
    console.error('Unhandled error during deployment:', error);
    process.exit(1);
  }
})();
