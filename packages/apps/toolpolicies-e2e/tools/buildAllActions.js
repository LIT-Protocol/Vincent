const fs = require('fs');
const path = require('path');
const { buildVincentTool } = require('./esbuild');

// Base directories for tools
const FAILURE_TOOLS_DIR = path.resolve(__dirname, '../src/lib/failure-tools');
const SUCCESS_TOOLS_DIR = path.resolve(__dirname, '../src/lib/success-tools');
const GENERATED_DIR = path.resolve(__dirname, '../src/generated');
const TSCONFIG_PATH = path.resolve(__dirname, '../tsconfig.app.json');

/**
 * Gets all tool directories in the specified base directory
 * @param {string} baseDir - The base directory to search in
 * @returns {string[]} Array of tool directory names
 */
function getToolDirectories(baseDir) {
  return fs.readdirSync(baseDir).filter((item) => {
    const itemPath = path.join(baseDir, item);
    return (
      fs.statSync(itemPath).isDirectory() &&
      fs.existsSync(path.join(itemPath, 'lit-action.ts')) &&
      fs.existsSync(path.join(itemPath, 'vincent-tool.ts'))
    );
  });
}

/**
 * Builds all tools in the specified directories
 */
async function buildAllTools() {
  // Ensure the generated directory exists
  if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
  }

  // Get all tool directories
  const failureTools = getToolDirectories(FAILURE_TOOLS_DIR);
  const successTools = getToolDirectories(SUCCESS_TOOLS_DIR);

  console.log(
    `Found ${failureTools.length} failure tools and ${successTools.length} success tools`,
  );
  console.log(`Building all tools in parallel...`);

  // Create build promises for failure tools
  const failureBuildPromises = failureTools.map(async (toolDir) => {
    const entryPoint = path.join(FAILURE_TOOLS_DIR, toolDir, 'lit-action.ts');
    const outdir = path.join(GENERATED_DIR, toolDir);

    console.log(`Starting build of failure tool: ${toolDir}`);
    try {
      await buildVincentTool({
        entryPoint,
        outdir,
        tsconfigPath: TSCONFIG_PATH,
      });
      console.log(`Successfully built failure tool: ${toolDir}`);
      return { toolDir, type: 'failure', success: true };
    } catch (error) {
      console.error(`Error building failure tool ${toolDir}:`, error);
      return { toolDir, type: 'failure', success: false, error: error.message };
    }
  });

  // Create build promises for success tools
  const successBuildPromises = successTools.map(async (toolDir) => {
    const entryPoint = path.join(SUCCESS_TOOLS_DIR, toolDir, 'lit-action.ts');
    const outdir = path.join(GENERATED_DIR, toolDir);

    console.log(`Starting build of success tool: ${toolDir}`);
    try {
      await buildVincentTool({
        entryPoint,
        outdir,
        tsconfigPath: TSCONFIG_PATH,
      });
      console.log(`Successfully built success tool: ${toolDir}`);
      return { toolDir, type: 'success', success: true };
    } catch (error) {
      console.error(`Error building success tool ${toolDir}:`, error);
      return { toolDir, type: 'success', success: false, error: error.message };
    }
  });

  // Wait for all builds to complete
  const results = await Promise.all([...failureBuildPromises, ...successBuildPromises]);

  // Print summary
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.length - successCount;

  console.log('\nBuild Summary:');
  console.log('===================');
  console.log(`Total: ${results.length}, Success: ${successCount}, Failed: ${failCount}`);

  if (failCount > 0) {
    console.log('\nFailed builds:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`- ${r.type} tool ${r.toolDir}: ${r.error}`);
      });
    throw new Error('Some builds failed');
  } else {
    console.log('All tools built successfully!');
  }
}

// Execute the build function
buildAllTools().catch((error) => {
  console.error('Error building tools:', error);
  process.exit(1);
});
