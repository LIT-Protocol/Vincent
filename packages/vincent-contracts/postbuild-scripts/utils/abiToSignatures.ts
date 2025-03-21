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

/**
 * Generates contract signatures from ABI files
 * @param abisDir - Directory containing ABI files
 * @param deploymentFile - Path to the deployment JSON file
 * @param outputDir - Directory where signatures file will be written
 * @returns The path to the generated signatures file
 */
export function abiToSignatures(
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

  const signatures: {
    [key: string]: {
      address: string;
      methods: {
        [key: string]: any;
      };
      events: any[];
      errors: any[];
    };
  } = {};

  for (const file of jsonFileNames) {
    const abi = JSON.parse(fs.readFileSync(path.join(abisDir, file), 'utf8'));
    const contractName = file.replace('.abi.json', '');
    console.log('Contract Name:', contractName);

    const address = DeployedJson.transactions.find(
      (t: any) => t.contractName === contractName
    )?.contractAddress;

    console.log('Address:', address);

    const methods = {};
    const events: any[] = [];
    const errors: any[] = [];

    abi.forEach((abiItem) => {
      if (abiItem.type === 'function') {
        try {
          methods[abiItem.name] = abiItem;
        } catch (error) {
          console.warn(
            `Failed to parse ABI item for method ${abiItem.name}:`,
            error
          );
        }
      } else if (abiItem.type === 'event') {
        events.push(abiItem);
      } else if (abiItem.type === 'error') {
        errors.push(abiItem);
      }
    });

    signatures[contractName] = {
      address,
      methods,
      events,
      errors,
    };
  }

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, 'vincent-signatures.ts');
  
  fs.writeFileSync(
    outputFile,
    `/**
 * Generated Contract Method Signatures for Vincent SDK
 * This file is auto-generated. DO NOT EDIT UNLESS YOU KNOW WHAT YOU'RE DOING.
 */

export const vincentDiamondAddress = '${diamondAddress}';

export const vincentSignatures = ${JSON.stringify(
      signatures,
      null,
      2
    )} as const;`
  );

  console.log(`✅ Vincent Signatures generated at: ${outputFile}`);
  return outputFile;
}