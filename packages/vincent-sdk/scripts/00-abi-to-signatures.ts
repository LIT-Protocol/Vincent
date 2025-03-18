/**
 * ABI to Signatures Generator
 *
 * This script reads ABI files from the Vincent contracts and generates a TypeScript file
 * containing method signatures and event definitions.
 */

// Configuration constants
const ABIS_DIR = 'packages/vincent-contracts/abis';
const DATIL_LATEST_DEPLOYMENT =
  'packages/vincent-contracts/broadcast/DeployVincentDiamond.sol/175188/deployToDatil-latest.json';
const DeployedJson = JSON.parse(
  fs.readFileSync(DATIL_LATEST_DEPLOYMENT, 'utf8')
);

import fs from 'fs';
import path from 'path';

// Read the latest deployment
const datilDiamondAddress = DeployedJson.returns[0].value;

console.log(`✅ [Datil] Vincent Diamond deployed at: ${datilDiamondAddress}`);

// Get all the ABI files
const jsonFiles = fs
  .readdirSync(ABIS_DIR)
  .filter((file) => file.endsWith('.json'));

console.log(jsonFiles);

const signatures: {
  [key: string]: {
    address: string;
    methods: {
      [key: string]: any;
    };
    events: any[];
  };
} = {};

for (const file of jsonFiles) {
  const abi = JSON.parse(fs.readFileSync(path.join(ABIS_DIR, file), 'utf8'));
  const contractName = file.replace('.abi.json', '');
  console.log('Contract Name:', contractName);

  const address = DeployedJson.transactions.find(
    (t: any) => t.contractName === contractName
  )?.contractAddress;

  console.log('Address:', address);

  const methods = {};
  const events: any[] = [];

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
    }
  });

  signatures[contractName] = {
    address,
    methods,
    events,
  };
}

fs.writeFileSync(
  './packages/vincent-sdk/networks/vDatil/datil-mainnet/vincent-signatures.ts',
  `/**
 * Generated Contract Method Signatures for Vincent SDK
 * This file is auto-generated. DO NOT EDIT UNLESS YOU KNOW WHAT YOU'RE DOING.
 */

export const vincentDiamondAddress = '${datilDiamondAddress}';

export const vincentSignatures = ${JSON.stringify(
    signatures,
    null,
    2
  )} as const;`
);

console.log(
  `✅ [Datil] Vincent Signatures generated at: ./packages/vincent-sdk/networks/vDatil/datil-mainnet/vincent-signatures.ts`
);
