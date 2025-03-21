/**
 * ABI to Signatures Generator
 *
 * This script reads ABI files from the Vincent contracts and generates a TypeScript file
 * containing method signatures and event definitions.
 */

import fs from 'fs';
import path from 'path';

// Default configuration constants
const DEFAULT_ABIS_DIR = './abis';

export function abiToTypeAssertions(
  deploymentFile: string ,
  outputDir: string 
): string {

  const abisDir = DEFAULT_ABIS_DIR;

  // Read the deployment file
  const DeployedJson = JSON.parse(
    fs.readFileSync(deploymentFile, 'utf8')
  );

  // Read the latest deployment
  const diamondAddress = DeployedJson.returns[0].value;

  console.log(`✅ Diamond deployed at: ${diamondAddress}`);

  // Get all the ABI files
  const jsonFileNames = fs
    .readdirSync(abisDir)
    .filter((file) => file.endsWith('.json'));

  const contractData : any = [];
  for (const file of jsonFileNames) {
    const contractName = file.replace('.abi.json', '');
    const abi = JSON.parse(fs.readFileSync(path.join(abisDir, file), 'utf8'));
    contractData.push({
      [contractName]: abi
    });
  }

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, 'vincent-contract-data.ts');
  
  fs.writeFileSync(
    outputFile,
    `/**
 * Generated Contract Data for Vincent SDK
 * This file is auto-generated. DO NOT EDIT UNLESS YOU KNOW WHAT YOU'RE DOING.
 */

export const vincentDiamondAddress = '${diamondAddress}';

export const vincentContractData = ${JSON.stringify(
      contractData,
      null,
      2
    )} as const;`
  );

  console.log(`✅ Vincent Contract Data generated at: ${outputFile}`);
  return outputFile;
}