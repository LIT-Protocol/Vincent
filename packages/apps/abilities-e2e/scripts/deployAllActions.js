const fs = require('fs');
const path = require('path');
const { deployLitAction } = require('./deploy-lit-action');

// Base directory for generated abilities
const GENERATED_DIR = path.resolve(__dirname, '../src/generated');

/**
 * Gets all action directories (abilities and policies) in the generated directory and its subdirectories
 * @returns {Object[]} Array of objects with actionName (relative path), fullPath, and type (ability or policy)
 */
function getActionDirectories() {
  const results = [];

  // Helper function to recursively search directories
  function searchDirectory(dir, relativePath = '') {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const itemRelativePath = relativePath ? path.join(relativePath, item) : item;

      if (fs.statSync(itemPath).isDirectory()) {
        // Check if this directory contains a ability
        if (
          fs.existsSync(path.join(itemPath, 'lit-action.js')) &&
          fs.existsSync(path.join(itemPath, 'vincent-ability-metadata.json'))
        ) {
          results.push({
            actionName: itemRelativePath,
            fullPath: itemPath,
            type: 'ability',
          });
        }
        // Check if this directory contains a policy
        else if (
          fs.existsSync(path.join(itemPath, 'lit-action.js')) &&
          fs.existsSync(path.join(itemPath, 'vincent-policy-metadata.json'))
        ) {
          results.push({
            actionName: itemRelativePath,
            fullPath: itemPath,
            type: 'policy',
          });
        } else {
          // Recursively search subdirectories
          searchDirectory(itemPath, itemRelativePath);
        }
      }
    }
  }

  searchDirectory(GENERATED_DIR);
  return results;
}

/**
 * Deploys all actions (abilities and policies) in the generated directory
 * @param {string} pinataJwt - The Pinata JWT for IPFS uploads
 */
async function deployAllActions(pinataJwt) {
  if (!pinataJwt) {
    console.error('Error: PINATA_JWT environment variable is required');
    process.exit(1);
  }

  // Get all action directories
  const actionDirs = getActionDirectories();

  if (actionDirs.length === 0) {
    console.log('No actions found in the generated directory. Please run buildActions.js first.');
    process.exit(0);
  }

  // Count abilities and policies
  const abilityCount = actionDirs.filter((a) => a.type === 'ability').length;
  const policyCount = actionDirs.filter((a) => a.type === 'policy').length;

  console.log(
    `Found ${actionDirs.length} actions to deploy (${abilityCount} abilities and ${policyCount} policies)`,
  );

  // Deploy all actions in parallel
  console.log(`Deploying ${actionDirs.length} actions...`);

  const deployPromises = actionDirs.map(async (action) => {
    const { actionName, fullPath, type } = action;

    try {
      console.log(`${type === 'ability' ? '🛠️' : '⚖️'} Deploying: ${actionName}`);
      const ipfsCid = await deployLitAction({
        generatedDir: fullPath,
        outputFile: 'lit-action.js',
        pinataJwt,
        type,
      });

      console.log(`Successfully deployed ${type}: ${actionName}`);
      return { actionName, type, ipfsCid, success: true };
    } catch (error) {
      console.error(`Error deploying ${type} ${actionName}:`, error);
      return { actionName, type, error: error.message, success: false };
    }
  });

  // Wait for all deployments to complete
  const results = await Promise.all(deployPromises);

  // Print summary
  console.log('\nDeployment Summary:');
  console.log('===================');

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.length - successCount;
  const successAbilities = results.filter((r) => r.success && r.type === 'ability').length;
  const successPolicies = results.filter((r) => r.success && r.type === 'policy').length;

  console.log(
    `Total: ${results.length}, Success: ${successCount} (${successAbilities} abilities, ${successPolicies} policies), Failed: ${failCount}`,
  );

  if (failCount > 0) {
    console.log('\nFailed deployments:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`- ${r.type} ${r.actionName}: ${r.error}`);
      });
    process.exit(1);
  }
}

// Main execution
(async () => {
  try {
    // Get Pinata JWT from environment variable
    const pinataJwt = process.env.PINATA_JWT;
    await deployAllActions(pinataJwt);
  } catch (error) {
    console.error('Unhandled error during deployment:', error);
    process.exit(1);
  }
})();
