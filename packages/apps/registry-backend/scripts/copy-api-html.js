// nx-ignore
const fs = require('fs-extra');
const path = require('path');

// Get the path to the installed package
let sourceFile;
try {
  // Find the path to the package.json file of the installed package
  const packageJsonPath = require.resolve('@lit-protocol/vincent-registry-sdk/package.json');
  // Get the directory containing the package.json
  const packageDir = path.dirname(packageJsonPath);
  // Path to the api.html file in the installed package
  sourceFile = path.join(packageDir, 'docs', 'api.html');
  console.log(`Looking for api.html at: ${sourceFile}`);
} catch (err) {
  console.error(`Error finding @lit-protocol/vincent-registry-sdk package: ${err.message}`);
  process.exit(1);
}

// Define target paths
const targetDir = path.resolve(__dirname, '../src/assets');
const targetFile = path.join(targetDir, 'apiHtml.json');

// Ensure the target directory exists
fs.ensureDirSync(targetDir);

// Copy the file
try {
  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Source file not found: ${sourceFile}`);
  }
  const sourceHtml = fs.readFileSync(sourceFile, 'utf8');
  const html = sourceHtml.replace('../src/generated/openapi.json', '/openApiJson');
  const output = { html };
  fs.writeJsonSync(targetFile, output);
  console.log(`Successfully copied api.html to ${targetFile}`);
} catch (err) {
  console.error(`Error copying api.html: ${err.message}`);
  process.exit(1);
}
